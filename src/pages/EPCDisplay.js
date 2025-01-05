import React, { useState, useEffect } from "react";
import { Table, Tag, notification, Button, Row, Col, Select } from "antd";
import SockJS from "sockjs-client";
import axios from "axios";

const { Option } = Select;

const EPCDisplay = () => {
  const [epcs, setEpcs] = useState([]);
  const [products, setProducts] = useState([]);
  const [sock, setSock] = useState(null);
  const [isReading, setIsReading] = useState(false); // Trạng thái đọc

  // Lấy danh sách sản phẩm từ API
  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3003/api/product/fetch-all"
      );
      console.log("response.data: ", response.data);

      setProducts(response.data);
    } catch (error) {
      notification.error({
        message: "Lỗi khi tải danh sách sản phẩm",
        description: error.message,
      });
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Hàm xử lý khi nhận EPC mới
  const handleNewEPC = (newEPC) => {
    console.log("newEPC: ", newEPC);

    setEpcs((prevEpcs) => {
      const existingIndex = prevEpcs.findIndex((epc) => epc.epc === newEPC.epc);

      if (existingIndex >= 0) {
        // Nếu sản phẩm đã tồn tại, tăng số lượng
        const updatedEpcs = [...prevEpcs];
        updatedEpcs[existingIndex].quantity += 1;
        return updatedEpcs;
      }

      // Nếu EPC mới, thêm vào danh sách
      return [
        ...prevEpcs,
        {
          ...newEPC,
          quantity: 1, // Số lượng bắt đầu từ 1
          product: newEPC.isAssigned ? newEPC.product : null,
        },
      ];
    });

    // Hiển thị thông báo nếu EPC chưa được gán
    if (!newEPC.isAssigned) {
      notification.warning({
        message: "EPC chưa được gán",
        description: `EPC ${newEPC.epc} chưa được gán.`,
      });
    }
  };

  // Hàm gọi API bắt đầu đọc
  const handleStart = async () => {
    try {
      await axios.post("http://localhost:8386/api/nation-rfid/start");
      setIsReading(true);
      notification.success({
        message: "Đã bắt đầu đọc EPC",
      });
    } catch (error) {
      notification.error({
        message: "Lỗi khi bắt đầu đọc",
        description: error.message,
      });
    }
  };

  // Hàm gọi API dừng đọc
  const handleStop = async () => {
    try {
      await axios.post("http://localhost:8386/api/nation-rfid/stop");
      setIsReading(false);
      notification.success({
        message: "Đã dừng đọc EPC",
      });
    } catch (error) {
      notification.error({
        message: "Lỗi khi dừng đọc",
        description: error.message,
      });
    }
  };

  // Hàm assign EPC
  const handleAssign = async (epc, productId) => {
    try {
      // Gọi API để gán EPC
      const response = await axios.post(
        "http://localhost:3003/api/epc/assign",
        {
          epc,
          productId,
        }
      );
      console.log("response.data: ", response.data);

      const assignedProduct = products.find(
        (product) => product._id === productId
      );

      console.log("assignedProduct: ", assignedProduct);

      notification.success({
        message: `EPC ${epc} đã được gán thành công!`,
      });

      // Cập nhật trạng thái EPC trong danh sách
      setEpcs((prevEpcs) =>
        prevEpcs.map((item) =>
          item.epc === epc
            ? {
                ...item,
                isAssigned: true,
                product: {
                  ...assignedProduct,
                  category: response.data.epc.product.category.name || "N/A",
                }, // Gắn thông tin sản phẩm vào EPC
              }
            : item
        )
      );
    } catch (error) {
      notification.error({
        message: "Lỗi khi gán EPC",
        description: error.message,
      });
    }
  };

  useEffect(() => {
    const socket = new SockJS("http://localhost:8090/echo");

    socket.onopen = () => {
      console.log("Kết nối thành công với WebSocket server!");
    };

    socket.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data); // Dữ liệu EPC từ server
        handleNewEPC(parsedData); // Xử lý dữ liệu EPC
      } catch (error) {
        console.error("Lỗi khi phân tích dữ liệu từ server:", error);
      }
    };

    socket.onclose = () => {
      console.warn("Mất kết nối với WebSocket server.");
    };

    setSock(socket); // Lưu WebSocket vào state

    return () => {
      socket.close(); // Đóng kết nối khi component unmount
    };
  }, []);

  // Cột của bảng
  const columns = [
    {
      title: "Hình Ảnh",
      dataIndex: ["product", "image"],
      key: "image",
      render: (image) =>
        image ? (
          <img
            src={image}
            alt="Hình ảnh sản phẩm"
            style={{ width: "50px", height: "50px", objectFit: "cover" }}
          />
        ) : (
          "N/A"
        ),
    },
    {
      title: "Tên Sản Phẩm",
      dataIndex: ["product", "name"],
      key: "name",
      render: (text, record) => (record.isAssigned ? text : record.epc),
    },
    {
      title: "Danh Mục",
      dataIndex: ["product", "category"],
      key: "category",
      render: (category) => category || "N/A",
    },
    {
      title: "Số Lượng",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Trạng thái",
      dataIndex: "isAssigned",
      key: "status",
      render: (isAssigned) => (
        <Tag color={isAssigned ? "green" : "red"}>
          {isAssigned ? "Đã gán" : "Chưa gán"}
        </Tag>
      ),
    },
    {
      title: "Hành Động",
      key: "actions",
      render: (_, record) =>
        !record.isAssigned && (
          <Select
            placeholder="Chọn sản phẩm"
            style={{ width: "200px" }}
            onChange={(productId) => handleAssign(record.epc, productId)}
          >
            {products.map((product) => (
              <Option key={product._id} value={product._id}>
                {product.name}
              </Option>
            ))}
          </Select>
        ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <Row justify="space-between" style={{ marginBottom: "20px" }}>
        <Col>
          <h1>Danh sách EPC</h1>
        </Col>
        <Col>
          <Button
            type="primary"
            onClick={handleStart}
            disabled={isReading}
            style={{ marginRight: "10px" }}
          >
            Đọc
          </Button>
          <Button type="danger" onClick={handleStop} disabled={!isReading}>
            Dừng
          </Button>
        </Col>
      </Row>
      <Table
        dataSource={epcs}
        columns={columns}
        rowKey="epc"
        rowClassName={(record) => (record.isAssigned ? "" : "epc-unassigned")}
      />
    </div>
  );
};

export default EPCDisplay;
