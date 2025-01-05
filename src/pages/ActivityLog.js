import React, { useState, useEffect } from "react";
import {
  Tabs,
  Table,
  Pagination,
  Spin,
  message,
  Input,
  DatePicker,
  Space,
  Button,
} from "antd";
import axios from "axios";
import moment from "moment";

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const ActivityLog = () => {
  const [activeTab, setActiveTab] = useState("product"); // Tab hiện tại
  const [logs, setLogs] = useState([]); // Dữ liệu log
  const [total, setTotal] = useState(0); // Tổng số log
  const [page, setPage] = useState(1); // Trang hiện tại
  const [loading, setLoading] = useState(false); // Trạng thái loading
  const [searchKeyword, setSearchKeyword] = useState(""); // Từ khóa tìm kiếm
  const [dateRange, setDateRange] = useState([]); // Phạm vi ngày
  const pageSize = 20; // Số item mỗi trang

  const columns = [
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      align: "center",
      render: (text) => <strong style={{ color: "#1890ff" }}>{text}</strong>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status) => (
        <span
          style={{
            color: status === "success" ? "green" : "red",
            fontWeight: "bold",
          }}
        >
          {status.toUpperCase()}
        </span>
      ),
    },
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      align: "center",
      render: (timestamp) => (
        <span style={{ color: "#7d7d7d" }}>
          {moment(timestamp).format("YYYY-MM-DD HH:mm:ss")}
        </span>
      ),
    },
    {
      title: "Details",
      dataIndex: "details",
      key: "details",
      align: "left",
      render: (details) => <span style={{ color: "#333" }}>{details}</span>,
    },
  ];

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: pageSize,
        keyword: searchKeyword || undefined,
      };

      // Thêm phạm vi ngày nếu có
      if (dateRange.length === 2) {
        params.startDate = moment(dateRange[0]).format("YYYY-MM-DD");
        params.endDate = moment(dateRange[1]).format("YYYY-MM-DD");
      }

      const response = await axios.get(
        `http://localhost:3003/api/activity-log/${activeTab}`,
        { params }
      );

      if (response.data.logs && typeof response.data.total === "number") {
        setLogs(response.data.logs);
        setTotal(response.data.total);
      } else {
        message.error("API response format is incorrect.");
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      message.error(
        error.response?.data?.message ||
          "Failed to fetch logs. Please check the API."
      );
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi đổi tab
  const handleTabChange = (key) => {
    setActiveTab(key);
    setPage(1);
    setSearchKeyword("");
    setDateRange([]);
    fetchLogs();
  };

  // Xử lý khi đổi trang
  const handlePageChange = (page) => {
    setPage(page);
  };

  // Xử lý khi thay đổi phạm vi ngày
  const handleDateChange = (dates) => {
    setDateRange(dates);
  };

  // Xử lý tìm kiếm
  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  // Gọi API khi page, activeTab, searchKeyword hoặc dateRange thay đổi
  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeTab]);

  return (
    <div style={{ padding: 20 }}>
      <Tabs activeKey={activeTab} onChange={handleTabChange} type="card">
        {["product", "category", "epc"].map((key) => (
          <TabPane
            tab={`${key.charAt(0).toUpperCase() + key.slice(1)} Logs`}
            key={key}
          >
            <FilterSection
              onSearch={handleSearch}
              searchKeyword={searchKeyword}
              setSearchKeyword={setSearchKeyword}
              dateRange={dateRange}
              handleDateChange={handleDateChange}
            />
            {loading ? (
              <Spin tip="Loading logs..." />
            ) : (
              <Table
                dataSource={logs}
                columns={columns}
                rowKey={(record) => record._id}
                pagination={false}
                scroll={{ x: 1000 }}
              />
            )}
          </TabPane>
        ))}
      </Tabs>
      <Pagination
        current={page}
        pageSize={pageSize}
        total={total}
        onChange={handlePageChange}
        style={{ marginTop: 20, textAlign: "center" }}
      />
    </div>
  );
};

// Component cho bộ lọc
const FilterSection = ({
  onSearch,
  searchKeyword,
  setSearchKeyword,
  dateRange,
  handleDateChange,
}) => (
  <div style={{ marginBottom: 20 }}>
    <Space>
      <Input
        placeholder="Search logs..."
        value={searchKeyword}
        onChange={(e) => setSearchKeyword(e.target.value)}
        style={{ width: 200 }}
      />
      <RangePicker
        value={dateRange}
        onChange={handleDateChange}
        format="YYYY-MM-DD"
      />
      <Button type="primary" onClick={onSearch}>
        Search
      </Button>
    </Space>
  </div>
);

export default ActivityLog;
