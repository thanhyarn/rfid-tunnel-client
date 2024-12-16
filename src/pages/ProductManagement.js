import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Row,
  Col,
  Select,
} from "antd";
import axios from "axios";

const { Option } = Select;

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3003/api/product/fetch-all"
      );
      setProducts(response.data);
    } catch (error) {
      message.error("Error fetching products");
    }
  };

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

  const handleAddProduct = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    form.setFieldsValue(product);
    setIsModalVisible(true);
  };

  const handleDeleteProduct = async (id) => {
    try {
      await axios.delete(`http://localhost:3003/api/product/delete-product/${id}`);
      message.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      message.error("Error deleting product");
    }
  };

  const handleFormSubmit = async () => {
    try {
      const values = form.getFieldsValue();
      if (editingProduct) {
        await axios.patch(
          `http://localhost:3003/api/product/update-product/${editingProduct._id}`,
          values
        );
        message.success("Product updated successfully");
      } else {
        await axios.post(
          "http://localhost:3003/api/product/add-product",
          values
        );
        message.success("Product added successfully");
      }
      setIsModalVisible(false);
      fetchProducts();
    } catch (error) {
      message.error("Error saving product");
    }
  };

  const handleSearch = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3003/api/product/search-product/${searchKeyword}`
      );
      setProducts(response.data);
    } catch (error) {
      message.error("Error searching products");
    }
  };

  const handleCategoryFilter = (value) => {
    setSelectedCategory(value);
  };

  const filteredProducts = products.filter((product) => {
    return selectedCategory
      ? product.category && product.category._id === selectedCategory
      : true;
  });

  const columns = [
    {
      title: "STT",
      dataIndex: "index",
      key: "index",
      render: (text, record, index) => index + 1,
    },
    {
      title: "Tên Sản Phẩm",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Mô Tả",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Barcode",
      dataIndex: "barcode",
      key: "barcode",
    },
    {
      title: "Danh Mục",
      dataIndex: ["category", "name"],
      key: "category",
      render: (text, record) =>
        record.category ? record.category.name : "N/A",
    },
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <>
          <Button type="link" onClick={() => handleEditProduct(record)}>
            Edit
          </Button>
          <Button
            type="link"
            danger
            onClick={() => handleDeleteProduct(record._id)}
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
        <Col span={6}>
          <Input
            placeholder="Barcode hoặc tên sản phẩm"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </Col>
        <Col span={6}>
          <Button type="primary" onClick={handleSearch}>
            Search
          </Button>
        </Col>
        <Col span={6}>
          <Select
            placeholder="Lọc theo danh mục"
            onChange={handleCategoryFilter}
            allowClear
            style={{ width: "100%" }}
          >
            {categories.map((category) => (
              <Option key={category._id} value={category._id}>
                {category.name}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={6} style={{ textAlign: "right" }}>
          <Button type="primary" onClick={handleAddProduct}>
            + Thêm sản phẩm
          </Button>
        </Col>
      </Row>
      <Table columns={columns} dataSource={filteredProducts} rowKey="_id" />

      <Modal
        title={editingProduct ? "Edit Product" : "Add Product"}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleFormSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tên Sản Phẩm"
            name="name"
            rules={[
              { required: true, message: "Please input the product name!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Mô Tả"
            name="description"
            rules={[
              { required: true, message: "Please input the description!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Barcode"
            name="barcode"
            rules={[{ required: true, message: "Please input the barcode!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Danh Mục"
            name="category"
            rules={[{ required: true, message: "Please select a category!" }]}
          >
            <Select placeholder="Chọn danh mục">
              {categories.map((category) => (
                <Option key={category._id} value={category._id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductManagement;
