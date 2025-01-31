import React, { useState, useEffect } from "react";
import { Button, DialogBody, DialogFooter, Input, Select, Option } from "@material-tailwind/react";
import { Toast } from "../components/Toast";
import { backend } from '../constants';

const ControlDeviceForm = ({ handleClose }) => {
    const [devices, setDevices] = useState([]); // List of devices
    const [selectedDevice, setSelectedDevice] = useState(null); // Selected device
    const [command, setCommand] = useState("");
    const [action, setAction] = useState("restart"); // Default action
    const [token, setToken] = useState(() => {
        const storedToken = localStorage.getItem('user');
        return storedToken ? JSON.parse(storedToken) : null;
    });
    const [isLoading, setIsLoading] = useState(false); // Loading state
    const [commandSuggestions, setCommandSuggestions] = useState([]); // Command suggestions

    // Predefined list of commands
    const predefinedCommands = [
        "sudo reboot",
        "sudo shutdown -h now",
        "sudo systemctl restart network",
        "sudo service apache2 restart",
        "sudo iptables -L",
        "sudo ufw enable",
        "sudo ufw disable",
    ];

    // Fetch devices on component mount
    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const response = await fetch(`${backend}/api/devices`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch devices');
                }

                const data = await response.json();
                // Filter devices to only include Switches and Access Points
                const filteredDevices = data.filter(
                    device => device.type === "Switch" || device.type === "Access Point"
                );
                setDevices(filteredDevices);
            } catch (error) {
                Toast("error", error.message);
            }
        };

        fetchDevices();
    }, [token]);

    // Handle command input changes
    const handleCommandChange = (e) => {
        const value = e.target.value;
        setCommand(value);

        // Filter predefined commands based on input
        if (value) {
            const filteredSuggestions = predefinedCommands.filter((cmd) =>
                cmd.toLowerCase().includes(value.toLowerCase())
            );
            setCommandSuggestions(filteredSuggestions);
        } else {
            setCommandSuggestions([]);
        }
    };

    // Handle command suggestion click
    const handleSuggestionClick = (suggestion) => {
        setCommand(suggestion);
        setCommandSuggestions([]); // Clear suggestions
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedDevice) {
            Toast("error", "Please select a device!");
            return;
        }

        // Confirmation dialog
        const confirmAction = window.confirm(`Are you sure you want to ${action} this device?`);
        if (!confirmAction) return;

        try {
            let endpoint = "";
            let body = {};

            switch (action) {
                case "restart":
                    endpoint = `${backend}/api/devices/${selectedDevice._id}/restart`;
                    break;
                case "shutdown":
                    endpoint = `${backend}/api/devices/${selectedDevice._id}/shutdown`;
                    break;
                case "configure":
                    if (!command) {
                        Toast("error", "Command is required for configuration!");
                        return;
                    }
                    endpoint = `${backend}/api/devices/${selectedDevice._id}/configure`;
                    body = { command };
                    break;
                default:
                    Toast("error", "Invalid action!");
                    return;
            }

            setIsLoading(true);
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: Object.keys(body).length > 0 ? JSON.stringify(body) : null,
            });

            if (!response.ok) {
                throw new Error("Failed to execute action.");
            }

            const result = await response.json();
            Toast("success", result.message);
            handleClose(); // Close the modal after successful execution
        } catch (error) {
            Toast("error", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DialogBody>
            <form className="bg-white px-8 pt-6 pb-8 mb-4" onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Select Device <span className="text-red-400">*</span>
                    </label>
                    <Select
                        value={selectedDevice ? selectedDevice._id : ""}
                        onChange={(value) => {
                            const device = devices.find((d) => d._id === value);
                            setSelectedDevice(device);
                        }}
                    >
                        {devices.map((device) => (
                            <Option key={device._id} value={device._id}>
                                {device.name} - {device.ip} ({device.mac})
                            </Option>
                        ))}
                    </Select>
                </div>

                {selectedDevice && (
                    <div className="mb-4">
                        <p className="text-gray-700 text-sm">
                            <strong>Name:</strong> {selectedDevice.name}
                        </p>
                        <p className="text-gray-700 text-sm">
                            <strong>IP:</strong> {selectedDevice.ip}
                        </p>
                        <p className="text-gray-700 text-sm">
                            <strong>MAC:</strong> {selectedDevice.mac}
                        </p>
                    </div>
                )}

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Action <span className="text-red-400">*</span>
                    </label>
                    <Select
                        value={action}
                        onChange={(value) => setAction(value)}
                    >
                        <Option value="restart">Restart</Option>
                        <Option value="shutdown">Shutdown</Option>
                        <Option value="configure">Configure</Option>
                    </Select>
                </div>

                {action === "configure" && (
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Command <span className="text-red-400">*</span>
                        </label>
                        <Input
                            type="text"
                            value={command}
                            onChange={handleCommandChange}
                            placeholder="Enter Command"
                            required
                        />
                        {commandSuggestions.length > 0 && (
                            <div className="mt-2 bg-gray-100 rounded-lg p-2">
                                {commandSuggestions.map((suggestion, index) => (
                                    <div
                                        key={index}
                                        className="p-2 hover:bg-gray-200 cursor-pointer"
                                        onClick={() => handleSuggestionClick(suggestion)}
                                    >
                                        {suggestion}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-center mx-4">
                    <Button
                        className="flex items-center gap-6 px-6 py-3 mt-4 text-sm"
                        size="sm"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? "Processing..." : "Execute"}
                    </Button>
                </div>
            </form>
        </DialogBody>
    );
};

export default ControlDeviceForm;