import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, message, Row, Col } from "antd";
import axios from "axios";

const Category = () => {
  const [categories, setCategories] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();
  const [searchKeyword, setSearchKeyword] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3003/api/category/fetch-all"
      );
      setCategories(response.data);
    } catch (error) {
      message.error("Error fetching categories");
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    form.setFieldsValue(category);
    setIsModalVisible(true);
  };

  const handleDeleteCategory = async (id) => {
    try {
      await axios.delete(
        `http://localhost:3003/api/category/delete-category/${id}`
      );
      message.success("Category deleted successfully");
      fetchCategories();
    } catch (error) {
      message.error("Error deleting category");
    }
  };

  const handleFormSubmit = async () => {
    try {
      const values = form.getFieldsValue();
      if (editingCategory) {
        await axios.patch(
          `http://localhost:3003/api/category/update-category/${editingCategory._id}`,
          values
        );
        message.success("Category updated successfully");
      } else {
        await axios.post(
          "http://localhost:3003/api/category/add-category",
          values
        );
        message.success("Category added successfully");
      }
      setIsModalVisible(false);
      fetchCategories();
    } catch (error) {
      message.error("Error saving category");
    }
  };

  const handleSearch = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3003/api/category/search-category/${searchKeyword}`
      );
      setCategories(response.data);
    } catch (error) {
      message.error("Error searching categories");
    }
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "index",
      key: "index",
      render: (text, record, index) => index + 1,
    },
    {
      title: "Tên Danh Mục",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Mô Tả",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Ngày Tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: "Ngày Cập Nhật",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <>
          <Button type="link" onClick={() => handleEditCategory(record)}>
            Edit
          </Button>
          <Button
            type="link"
            danger
            onClick={() => handleDeleteCategory(record._id)}
          >
            Delete
          </Button>
        </>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Input.Search
            placeholder="Tìm kiếm tên danh mục"
            enterButton="Search"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onSearch={handleSearch}
          />
        </Col>
        <Col span={12} style={{ textAlign: "right" }}>
          <Button type="primary" onClick={handleAddCategory}>
            + Thêm danh mục
          </Button>
        </Col>
      </Row>
      <Table columns={columns} dataSource={categories} rowKey="_id" />

      <Modal
        title={editingCategory ? "Edit Category" : "Add Category"}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleFormSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: "Please input the category name!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: "Please input the description!" },
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Category;
