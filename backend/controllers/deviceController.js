const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Device = require("../models/deviceModel");
const ping = require("ping");
const os = require("os");
const ip = require("ip");
const arp = require("node-arp");
const { getVendor } = require("mac-oui-lookup");
const { NodeSSH } = require("node-ssh"); // Import node-ssh

// Initialize SSH
const ssh = new NodeSSH();

// Utility function to execute SSH commands
const executeSSHCommand = async (device, command) => {
    try {
        await ssh.connect({
            host: device.ip,
            username: device.sshUsername,
            password: device.sshPassword,
        });
        const result = await ssh.execCommand(command);
        return result;
    } catch (error) {
        throw new Error(`SSH command failed: ${error.message}`);
    } finally {
        ssh.dispose();
    }
};

//@desc Get all Devices
//@route GET /api/devices
//@access private
const getDevices = asyncHandler(async (req, res) => {
    const devices = await Device.find({});
    if (devices) {
        res.status(200).json(devices);
    } else {
        res.status(400);
        throw new Error("Could not fetch devices!");
    }
});

//@desc Get a single device
//@route GET /api/devices/:id
//@access private
const getDevice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid device id!");
    }

    const device = await Device.findById(id);
    if (device) {
        res.status(200).json(device);
    } else {
        res.status(400);
        throw new Error("Could not fetch the device!");
    }
});

//@desc Add a Device
//@route POST /api/devices/
//@access private
const addDevice = asyncHandler(async (req, res) => {
    const { name, type, ip, location, description, sshUsername, sshPassword } = req.body;

    let finalDescription = description;
    if (!finalDescription) {
        finalDescription = `${name} at ${location}`;
    }
    if (!name || !ip || !type || !location || !sshUsername || !sshPassword) {
        res.status(400);
        throw new Error("Please fill out all mandatory fields!");
    }

    // Check for existing device IP
    const availableIP = await Device.findOne({ ip });
    if (availableIP) {
        res.status(400);
        throw new Error("Device with this IP already exists!");
    }

    const device = await Device.create({
        name,
        type,
        ip,
        location,
        description: finalDescription,
        sshUsername,
        sshPassword,
    });

    if (device) {
        res.status(201).json({
            _id: device._id,
            name: device.name,
            ip: device.ip,
            type: device.type,
            location: device.location,
            description: device.description,
            sshUsername: device.sshUsername,
            sshPassword: device.sshPassword,
        });
    } else {
        res.status(400);
        throw new Error("Invalid device data!");
    }
});

//@desc Update a single device
//@route PUT /api/devices/:id
//@access private
const updateDevice = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid device id!");
    }

    const device = await Device.findOneAndUpdate(
        { _id: id },
        { ...req.body },
        { new: true }
    );

    if (device) {
        res.status(200).json(device);
    } else {
        res.status(400);
        throw new Error("Could not update the device!");
    }
});

//@desc Restart a device
//@route POST /api/devices/:id/restart
//@access private
const restartDevice = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid device id!");
    }

    const device = await Device.findById(id);
    if (!device) {
        res.status(404);
        throw new Error("Device not found!");
    }

    try {
        const result = await executeSSHCommand(device, "sudo reboot");
        res.status(200).json({ message: "Device restarted successfully.", result });
    } catch (error) {
        res.status(500).json({ message: "Failed to restart device.", error: error.message });
    }
});

//@desc Shutdown a device
//@route POST /api/devices/:id/shutdown
//@access private
const shutdownDevice = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid device id!");
    }

    const device = await Device.findById(id);
    if (!device) {
        res.status(404);
        throw new Error("Device not found!");
    }

    try {
        const result = await executeSSHCommand(device, "sudo shutdown -h now");
        res.status(200).json({ message: "Device shutdown successfully.", result });
    } catch (error) {
        res.status(500).json({ message: "Failed to shutdown device.", error: error.message });
    }
});

//@desc Configure a device
//@route POST /api/devices/:id/configure
//@access private
const configureDevice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { command } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid device id!");
    }

    if (!command) {
        res.status(400);
        throw new Error("Command is required!");
    }

    const device = await Device.findById(id);
    if (!device) {
        res.status(404);
        throw new Error("Device not found!");
    }

    try {
        const result = await executeSSHCommand(device, command);
        res.status(200).json({ message: "Command executed successfully.", result });
    } catch (error) {
        res.status(500).json({ message: "Failed to execute command.", error: error.message });
    }
});

//@desc Delete a device
//@route DELETE /api/devices/:id
//@access private
const deleteDevice = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid device id!");
    }

    const device = await Device.findOneAndDelete({ _id: id });
    if (device) {
        res.status(200).json(device);
    } else {
        res.status(400);
        throw new Error("Could not delete the device!");
    }
});


function getSubnet() {
  const interfaces = os.networkInterfaces();
  console.log("Network interfaces:", interfaces);

  for (const dev of Object.keys(interfaces)) {
    for (const details of interfaces[dev]) {
      console.log("Checking interface:", dev, details);
      if (details.family === "IPv4" && !details.internal) {
        try {
          // Use the CIDR notation directly from the interface details
          if (details.cidr) {
            console.log("Found subnet using CIDR:", details.cidr);
            return details.cidr;
          }

          // Fallback: Calculate subnet using ip.network
          const network = ip.network(details.address, details.netmask);
          console.log("Found subnet using ip.network:", network.network + "/" + network.cidr);
          return network.network + "/" + network.cidr;
        } catch (error) {
          console.error("Error calculating subnet:", error);
        }
      }
    }
  }

  console.log("No valid subnet found");
  return null;
}

//@desc Scan network
//@route POST /api/devices/scan/
//@access private
const scanNetwork = asyncHandler(async (req, res) => {
  console.log("scanNetwork function called");

  // Get the subnet of the current network
  const subnet = getSubnet();
  if (!subnet) {
      console.log("Could not determine subnet");
      res.status(400);
      throw new Error("Could not determine subnet!");
  }

  console.log("Starting network scan on subnet:", subnet);

  try {
      const hosts = [];
      const network = ip.cidrSubnet(subnet);

      // Generate all IP addresses in the subnet
      for (let i = 1; i < 255; i++) {
          hosts.push(network.networkAddress.replace(/\d+$/, i));
      }

      console.log("Pinging hosts...");

      // Ping all hosts in parallel
      const pingPromises = hosts.map((host) => {
          console.log("Pinging host:", host);
          return ping.promise.probe(host, { timeout: 1 }); // 1-second timeout
      });

      const pingResults = await Promise.all(pingPromises);

      // Filter out alive devices
      const discoveredDevices = pingResults.filter((result) => result.alive);

      console.log("Network scan completed. Devices found:", discoveredDevices.length);

      // Process discovered devices
      const addedDevices = [];
      for (const device of discoveredDevices) {
          const deviceIp = device.host;

          // Get MAC address using ARP
          const mac = await new Promise((resolve) => {
              arp.getMAC(deviceIp, (err, mac) => {
                  if (err || !mac) {
                      console.log(`Could not fetch MAC address for ${deviceIp}:`, err);
                      resolve("Unknown");
                  } else {
                      resolve(mac);
                  }
              });
          });

          // Get device vendor using MAC address
          let vendor = "Unknown";
          if (mac !== "Unknown") {
              vendor = getVendor(mac) || "Unknown";
          }

          // Determine device type based on vendor
          let type = "Other"; // Default to "Other"
          const vendorLower = vendor.toLowerCase();
          if (vendorLower.includes("cisco")) {
              type = "Switch";
          } else if (
              vendorLower.includes("aruba") ||
              vendorLower.includes("ubiquiti") ||
              vendorLower.includes("tp-link") ||
              vendorLower.includes("d-link") ||
              vendorLower.includes("tplink") ||
              vendorLower.includes("dlink")
          ) {
              type = "Access Point";
          } else if (vendorLower.includes("domain") || vendorLower.includes("dns")) {
              type = "Domain";
          }

          // Check if the device already exists in the database using MAC address
          const existingDevice = await Device.findOne({ mac });
          if (!existingDevice) {
              // Add the device to the database if it doesn't exist
              const newDevice = await Device.create({
                  name: vendor !== "Unknown" ? vendor : "Unknown Device",
                  type,
                  ip: deviceIp,
                  location: "Unknown", // Default location
                  description: "Auto-discovered device",
                  mac,
                  sshUsername: "admin", // Default SSH username
                  sshPassword: "admin", // Default SSH password
              });
              addedDevices.push(newDevice);
          }
      }

      console.log("Added devices:", addedDevices.length);
      res.status(200).json({ message: "Network scan completed.", devices: addedDevices });
  } catch (error) {
      console.error("Error during network scan:", error);
      res.status(500).json({ message: "Network scan failed", error: error.message });
  }
});

module.exports = {
    getDevice,
    getDevices,
    addDevice,
    updateDevice,
    deleteDevice,
    scanNetwork,
    restartDevice,
    shutdownDevice,
    configureDevice,
};