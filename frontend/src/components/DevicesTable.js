import { Link } from "react-router-dom";
import { useContext, useEffect, useState } from 'react';
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { CiCircleInfo } from "react-icons/ci";
import {
  Card,
  CardHeader,
  Input,
  Typography,
  CardBody,
  Chip,
  Tabs,
  TabsHeader,
  Tab,
  IconButton,
  Tooltip,
} from "@material-tailwind/react";

const DevicesTable = ({
    selectedTab,
    handleTabChange,
    data,
    TABLE_HEAD,
    TABLE_ROWS,
    TABS,
    searchTerm,
    setSearchTerm,
    totalDevices,
    filteredDevices,
  }) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  
    const requestSort = (key) => {
      let direction = "asc";
      if (sortConfig.key === key && sortConfig.direction === "asc") {
        direction = "desc";
      }
      setSortConfig({ key, direction });
    };
  

  // Sorting logic
  const sortedRows = [...TABLE_ROWS].sort((a, b) => {
    if (sortConfig.key) {
      let valueA = a[sortConfig.key];
      let valueB = b[sortConfig.key];
  
      // Handle "Name" and "Status" sorting
      if (sortConfig.key === "name" || sortConfig.key === "status" || sortConfig.key ==="ip" ) {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }
  
      if (valueA < valueB) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
    }
    return 0;
  });


   
  
    return (
      <Card className="h-full max-h-[100vh] w-full">
        <CardHeader floated={false} shadow={false} className="rounded-none pt-2 pb-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <Tabs value={selectedTab} className="w-full md:w-max">
              <TabsHeader>
                {TABS.map(({ label, value }) => (
                  <Tab
                    key={value}
                    value={value}
                    onClick={() => handleTabChange(value)}
                  >
                    &nbsp;&nbsp;{label}&nbsp;&nbsp;
                  </Tab>
                ))}
              </TabsHeader>
            </Tabs>
            <div className="w-full md:w-72">
              <Input
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
              />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-700 pb-4">
            Showing {filteredDevices} of {totalDevices} devices
          </div>
        </CardHeader>
        {!data && <div className="p-8 text-center">Database is Empty!</div>}
        {TABLE_ROWS.length === 0 && <div className="p-8 text-center">No devices found!</div>}
        {data && data !== "" && TABLE_ROWS.length !== 0 && (
          <>
            <CardBody className="overflow-scroll px-0">
              <div className="table-container">
                <table className="mt-4 w-full min-w-max table-auto text-left">
                <thead>
                <tr>
                    {TABLE_HEAD.map((head, index) => {
                    const isSortable = ["name", "ip", "status"].includes(
                        head.toLowerCase().replace(" ", "")
                    );
                    return (
                        <th
                        key={head}
                        className={`cursor-pointer border-y border-blue-gray-100 bg-blue-gray-50/50 p-4 transition-colors hover:bg-blue-gray-50 ${
                            isSortable ? "" : "pointer-events-none"
                        }`}
                        onClick={() => isSortable && requestSort(head.toLowerCase().replace(" ", ""))}
                        >
                        <Typography
                            variant="small"
                            color="blue-gray"
                            className="flex items-center justify-between gap-2 font-normal leading-none opacity-70"
                        >
                            {head}{" "}
                            {isSortable && sortConfig.key === head.toLowerCase().replace(" ", "") && (
                            <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                            )}
                        </Typography>
                        </th>
                    );
                    })}
                </tr>
                </thead>
                  <tbody>
                    {sortedRows.map(
                      (
                        { id, name, location, type, mac, ip, status, responseTime, lastUpdated },
                        index
                      ) => {
                        const isLast = index === sortedRows.length - 1;
                        const classes = isLast
                          ? "p-4"
                          : "p-4 border-b border-blue-gray-50";
  
                        return (
                          <tr key={id} className="hover:bg-gray-100 transition-colors">
                            <td className={classes}>
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                  <Typography
                                    variant="small"
                                    color="blue-gray"
                                    className="font-normal"
                                  >
                                    {name}
                                  </Typography>
                                  <Typography
                                    variant="small"
                                    color="blue-gray"
                                    className="font-normal opacity-70"
                                  >
                                    {location}
                                  </Typography>
                                </div>
                              </div>
                            </td>
                            <td className={classes}>
                              <div className="flex flex-col">
                                <Typography
                                  variant="small"
                                  color="blue-gray"
                                  className="font-normal"
                                >
                                  {mac}
                                </Typography>
                              </div>
                            </td>
                            <td className={classes}>
                              <div className="flex flex-col">
                                <Typography
                                  variant="small"
                                  color="blue-gray"
                                  className="font-normal"
                                >
                                  {ip}
                                </Typography>
                              </div>
                            </td>
                            <td className={classes}>
                              <div className="flex flex-col">
                                <Typography
                                  variant="small"
                                  color="blue-gray"
                                  className="font-normal"
                                >
                                  {type}
                                </Typography>
                              </div>
                            </td>
                            <td className={classes}>
                              <div className="w-max">
                                <Chip
                                  variant="ghost"
                                  size="sm"
                                  value={status}
                                  color={
                                    status === "up"
                                      ? "green"
                                      : status === "down"
                                      ? "red"
                                      : "blue-gray"
                                  }
                                />
                              </div>
                            </td>
                            <td className={classes}>
                              <Typography
                                variant="small"
                                color="blue-gray"
                                className="font-normal"
                              >
                                {responseTime}
                              </Typography>
                            </td>
                            <td className={classes}>
                              <Typography
                                variant="small"
                                color="blue-gray"
                                className="font-normal"
                              >
                                {lastUpdated}
                              </Typography>
                            </td>
                            <td className={classes}>
                              <Link to={"/device/" + id}>
                                <Tooltip content="Edit Device">
                                  <IconButton variant="text">
                                    <CiCircleInfo className="h-6 w-6" />
                                  </IconButton>
                                </Tooltip>
                              </Link>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </>
        )}
      </Card>
    );
  };
  
  export default DevicesTable;