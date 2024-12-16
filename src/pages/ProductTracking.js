import React, { useState, useEffect } from "react";
import {
  InputNumber,
  Button,
  Table,
  Space,
  Typography,
  notification,
} from "antd";

const ProductTracking = () => {
  const [readingTime, setReadingTime] = useState(
    parseInt(localStorage.getItem("readingTime")) || 8
  ); // Load from localStorage or use default
  const [requiredTags, setRequiredTags] = useState(
    parseInt(localStorage.getItem("requiredTags")) || 30
  ); // Load from localStorage or use default
  const [dataSource, setDataSource] = useState([]); // Dynamic data for the table
  const [isReading, setIsReading] = useState(false); // State to manage reading status

  const columns = [
    {
      title: "EPC",
      dataIndex: "epc",
      key: "epc",
    },
    {
      title: "CTN",
      dataIndex: "ctn",
      key: "ctn",
    },
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
    },
  ];

  useEffect(() => {
    // Save readingTime to localStorage
    localStorage.setItem("readingTime", readingTime);
  }, [readingTime]);

  useEffect(() => {
    // Save requiredTags to localStorage
    localStorage.setItem("requiredTags", requiredTags);
  }, [requiredTags]);

  const fetchProductData = async () => {
    try {
      const response = await fetch("http://localhost:7024/Rfid/request");
      if (response.ok) {
        const newData = await response.json();
        setDataSource(newData); // Replace the dataSource with the new data
      } else {
        console.error("Failed to fetch data.");
      }
    } catch (error) {
      console.error("Error while fetching data:", error);
    }
  };

  const handleStart = async () => {
    try {
      setIsReading(true);
      const response = await fetch("http://localhost:7024/Rfid/start", {
        method: "GET",
      });
      if (!response.ok) {
        notification.error({ message: "Failed to start reader" });
        setIsReading(false);
        return;
      }

      notification.success({ message: "Reader started successfully" });

      // Call the request API every 0.5 seconds
      const interval = setInterval(fetchProductData, 500);

      // Stop reading after the reading time
      setTimeout(async () => {
        clearInterval(interval);

        try {
          const stopResponse = await fetch("http://localhost:7024/Rfid/stop", {
            method: "GET",
          });
          if (!stopResponse.ok) {
            notification.error({ message: "Failed to stop reader" });
          } else {
            notification.success({ message: "Reader stopped successfully" });

            // Clear data on the server
            const removeAllResponse = await fetch(
              "http://localhost:7024/Rfid/removeAllData",
              { method: "GET" }
            );
            if (removeAllResponse.ok) {
              notification.success({
                message: "Data Cleared",
                description: "All data has been removed from the server.",
              });
              setDataSource([]); // Clear local dataSource
            } else {
              notification.error({
                message: "Failed to Clear Data",
                description: "Could not clear data on the server.",
              });
            }

            // Check if the number of items matches the required tags
            const currentTags = dataSource.length;

            if (currentTags < requiredTags) {
              notification.warning({
                message: "Check Again",
                description: `The system read only ${currentTags} tags, which is less than the required ${requiredTags}.`,
              });
            } else if (currentTags > requiredTags) {
              notification.warning({
                message: "Exceeds Required Tags",
                description: `The system read ${currentTags} tags, which exceeds the required ${requiredTags}.`,
              });
            } else {
              notification.success({
                message: "Success",
                description: `The system read exactly ${requiredTags} tags.`,
              });
            }
          }
        } catch (error) {
          console.error("Error while stopping reader:", error);
        } finally {
          setIsReading(false);
        }
      }, readingTime * 1000);
    } catch (error) {
      console.error("Error while starting reader:", error);
      setIsReading(false);
    }
  };

  const renderStatus = () => {
    const currentTags = dataSource.length;
    const statusStyle = {
      fontSize: "24px",
      fontWeight: "bold",
      padding: "10px 0",
    };

    let currentTagsStyle = {};
    if (currentTags < requiredTags) {
      currentTagsStyle = { color: "red" };
    } else if (currentTags === requiredTags) {
      currentTagsStyle = { color: "green" };
    } else {
      currentTagsStyle = { color: "orange" }; // Example color for exceeding requiredTags
    }

    return (
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <Typography.Text style={{ ...statusStyle, ...currentTagsStyle }}>
          {currentTags}
        </Typography.Text>
        <Typography.Text style={{ ...statusStyle, color: "green" }}>
          /{requiredTags}
        </Typography.Text>
      </div>
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <Typography.Title level={4}>Product Tracking</Typography.Title>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Status Display */}

        {/* Input Fields */}
        <Space direction="horizontal" size="middle" style={{ width: "100%" }}>
          <div>
            <Typography.Text>Reading Time (Seconds):</Typography.Text>
            <InputNumber
              min={1}
              max={60}
              value={readingTime}
              onChange={setReadingTime}
              style={{ width: "150px", marginLeft: "10px" }}
            />
          </div>
          <div>
            <Typography.Text>Required Tags:</Typography.Text>
            <InputNumber
              min={1}
              value={requiredTags}
              onChange={setRequiredTags}
              style={{ width: "150px", marginLeft: "10px" }}
            />
          </div>

          <Button
            type="primary"
            onClick={handleStart}
            disabled={isReading}
            loading={isReading}
          >
            Action
          </Button>
        </Space>

        {/* Table */}
        {renderStatus()}

        <Table dataSource={dataSource} columns={columns} bordered />
      </Space>
    </div>
  );
};

export default ProductTracking;