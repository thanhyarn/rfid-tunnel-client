import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Input, Form, message } from "antd";
import axios from "axios";

const EpcManagement = () => {
  const [epcList, setEpcList] = useState([]); // Danh sách EPC
  const [isAddModalVisible, setIsAddModalVisible] = useState(false); // Modal "Add EPC"
  const [isAddMoreModalVisible, setIsAddMoreModalVisible] = useState(false); // Modal "Add More EPC"
  const [newEpc, setNewEpc] = useState(""); // Giá trị EPC mới
  const [bulkEpcs, setBulkEpcs] = useState([]); // Danh sách EPC cho "Add More EPC"
  const [form] = Form.useForm(); // Ant Design form instance

  // Lấy danh sách EPC từ API
  const fetchEpcs = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3003/api/epc/fetch-all"
      );
      setEpcList(response.data);
    } catch (error) {
      console.error("Error fetching EPC list", error);
      message.error("Failed to fetch EPCs");
    }
  };

  // Thêm một EPC mới
  const addEpc = async () => {
    try {
      if (!newEpc.trim()) {
        return message.warning("EPC cannot be empty");
      }
      await axios.post("http://localhost:3003/api/epc/add-epc", {
        epc: newEpc,
      });
      message.success("EPC added successfully");
      setNewEpc(""); // Reset EPC input
      fetchEpcs(); // Refresh danh sách
      setIsAddModalVisible(false); // Đóng modal
    } catch (error) {
      console.error("Error adding EPC", error);
      message.error("Failed to add EPC");
    }
  };

  // Thêm nhiều EPC
  const addBulkEpcs = async () => {
    try {
      if (bulkEpcs.length === 0) {
        return message.warning("No EPCs to add");
      }
      for (let epc of bulkEpcs) {
        await axios.post("http://localhost:3003/api/epc/add-epc", { epc });
      }
      message.success("Bulk EPCs added successfully");
      setBulkEpcs([]); // Reset danh sách
      setIsAddMoreModalVisible(false); // Đóng modal
      fetchEpcs(); // Refresh danh sách
    } catch (error) {
      console.error("Error adding bulk EPCs", error);
      message.error("Failed to add bulk EPCs");
    }
  };

  // Thêm một EPC vào danh sách bulk
  const addToBulkList = (value) => {
    if (!value.trim()) return message.warning("EPC cannot be empty");
    setBulkEpcs((prev) => [...prev, value]);
    form.resetFields(); // Reset form input
  };

  // Xóa EPC khỏi danh sách bulk
  const removeFromBulkList = (index) => {
    setBulkEpcs((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    fetchEpcs();
  }, []);

  // Cột cho bảng EPC
  const columns = [
    {
      title: "No.",
      dataIndex: "index",
      key: "index",
      render: (_, __, index) => index + 1,
    },
    {
      title: "EPC",
      dataIndex: "epc",
      key: "epc",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button type="link" danger>
          Delete
        </Button>
      ),
    },
  ];

  // Cột cho bảng trong Add More EPC
  const bulkColumns = [
    {
      title: "No.",
      dataIndex: "index",
      key: "index",
      render: (_, __, index) => index + 1,
    },
    {
      title: "EPC",
      dataIndex: "epc",
      key: "epc",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record, index) => (
        <Button type="link" danger onClick={() => removeFromBulkList(index)}>
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>EPC Management</h1>
      <Table
        dataSource={epcList}
        columns={columns}
        rowKey={(record) => record._id}
        pagination={{ pageSize: 10 }}
      />
      <div style={{ marginTop: "20px" }}>
        <Button
          type="primary"
          onClick={() => setIsAddModalVisible(true)}
          style={{ marginRight: "10px" }}
        >
          Add EPC
        </Button>
        <Button type="primary" onClick={() => setIsAddMoreModalVisible(true)}>
          Add More EPC
        </Button>
      </div>

      {/* Modal Add EPC */}
      <Modal
        title="Add EPC"
        visible={isAddModalVisible}
        onOk={addEpc}
        onCancel={() => setIsAddModalVisible(false)}
        okText="Add"
        cancelText="Cancel"
      >
        <Input
          placeholder="Enter EPC"
          value={newEpc}
          onChange={(e) => setNewEpc(e.target.value)}
        />
      </Modal>

      {/* Modal Add More EPC */}
      <Modal
        title="Add More EPCs"
        visible={isAddMoreModalVisible}
        onOk={addBulkEpcs}
        onCancel={() => setIsAddMoreModalVisible(false)}
        okText="Add All"
        cancelText="Cancel"
        width={800}
      >
        <Form form={form} onFinish={({ epc }) => addToBulkList(epc)}>
          <Form.Item
            name="epc"
            rules={[{ required: true, message: "EPC is required" }]}
          >
            <Input placeholder="Enter EPC" />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Add to List
          </Button>
        </Form>
        <Table
          dataSource={bulkEpcs.map((epc, index) => ({ key: index, epc }))}
          columns={bulkColumns}
          pagination={false}
        />
      </Modal>
    </div>
  );
};

export default EpcManagement;
