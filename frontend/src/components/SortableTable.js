import { formatDistanceToNow } from "date-fns";
import { useContext, useState, useEffect } from "react";
import { DeviceContext } from "../contexts/DeviceContext";
import { Spinner } from "@material-tailwind/react";
import DevicesTable from "./DevicesTable";

const TABS = [
  {
    label: "All",
    value: "all",
  },
  {
    label: "Up",
    value: "up",
  },
  {
    label: "Down",
    value: "down",
  },
];

const TABLE_HEAD = ["Name", "MAC Address", "IP Address", "Type", "Status", "Response Time", "Last Updated", ""];

const TimeAgo = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

const TimeAgoNoSuffix = (date) => {
  return formatDistanceToNow(new Date(date));
};

function searchObjects(data, searchTerm) {
  if (!searchTerm) return data;

  const lowerSearchTerm = searchTerm.toLowerCase();
  return data.filter((obj) => {
    return Object.values(obj).some((value) =>
      String(value).toLowerCase().includes(lowerSearchTerm)
    );
  });
}

export default function SortableTable(props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const { devices, isPending } = useContext(DeviceContext);
  const [data, setData] = useState(devices);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    if (devices) {
      let filteredDevices = devices;

      // Filter by tab
      if (selectedTab === "up") {
        filteredDevices = devices.filter((device) => device.status === "up");
      } else if (selectedTab === "down") {
        filteredDevices = devices.filter((device) => device.status === "down");
      }

      // Filter by type (if provided)
      if (props.filter) {
        filteredDevices = filteredDevices.filter(
          (device) => device.type === props.filter
        );
      }

      // Filter by search term
      if (searchTerm) {
        filteredDevices = searchObjects(filteredDevices, searchTerm);
      }

      setFilteredData(filteredDevices);
    }
  }, [devices, selectedTab, props.filter, searchTerm]);

  const handleTabChange = (value) => {
    setSelectedTab(value);
  };

  const TABLE_ROWS = filteredData.map((item) => ({
    id: item._id,
    name: item.name,
    mac: item.mac,
    location: item.location,
    ip: item.ip,
    type: item.type,
    status: item.status,
    responseTime: item.responseTime === "-1" ? "n/a" : item.responseTime + "ms",
    lastUpdated:
      item.status === "down"
        ? "(Down since) " + TimeAgoNoSuffix(item.updatedAt)
        : TimeAgo(item.updatedAt),
  }));

  return (
    <>
      {isPending && <Spinner />}
      {data && (
        <DevicesTable
          selectedTab={selectedTab}
          handleTabChange={handleTabChange}
          data={filteredData}
          TABLE_HEAD={TABLE_HEAD}
          TABLE_ROWS={TABLE_ROWS}
          TABS={TABS}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          totalDevices={devices.length}
          filteredDevices={filteredData.length}
        />
      )}
    </>
  );
}