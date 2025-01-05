import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Card,
  Typography,
  Tag,
  message,
  Modal,
  Select,
} from "antd";
import SockJS from "sockjs-client";
import axios from "axios";

const { Title } = Typography;
const { Option } = Select;

const EPCManagement = () => {
  const [epcList, setEpcList] = useState([]); // Danh sách EPC từ WebSocket
  const [products, setProducts] = useState([]); // Danh sách sản phẩm
  const [isScanning, setIsScanning] = useState(false); // Trạng thái quét EPC
  const [sock, setSock] = useState(null); // WebSocket instance
  const [isModalVisible, setIsModalVisible] = useState(false); // Trạng thái popup
  const [selectedEPC, setSelectedEPC] = useState(null); // EPC đang được chọn
  const [selectedProduct, setSelectedProduct] = useState(null); // Sản phẩm đang được chọn

  // Kết nối WebSocket khi component mount
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

  // Lấy danh sách sản phẩm khi component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3003/api/product/fetch-all"
        );
        setProducts(response.data);
      } catch (error) {
        message.error("Lỗi khi tải danh sách sản phẩm.");
      }
    };
    fetchProducts();
  }, []);

  // Bắt đầu đọc EPC
  const handleStartScan = async () => {
    try {
      await axios.post("http://localhost:8386/api/nation-rfid/start"); // Gọi lệnh start
      setEpcList([]); // Reset danh sách EPC
      setIsScanning(true);
      message.success("Bắt đầu quét EPC...");
    } catch (error) {
      message.error("Lỗi khi bắt đầu quét EPC.");
    }
  };

  // Dừng đọc EPC
  const handleStopScan = async () => {
    try {
      await axios.post("http://localhost:8386/api/nation-rfid/stop"); // Gọi lệnh stop
      setIsScanning(false);
      message.success("Dừng quét EPC.");
    } catch (error) {
      message.error("Lỗi khi dừng quét EPC.");
    }
  };

  // Xử lý EPC mới nhận được
  const handleNewEPC = (data) => {
    setEpcList((prevList) => {
      const exists = prevList.some((epc) => epc.epc === data.epc);
      if (!exists) {
        return [
          ...prevList,
          {
            epc: data.epc,
            productName: data.product?.name || "N/A",
            status: data.isAssigned ? "Assigned" : "Unassigned",
          },
        ];
      }
      return prevList;
    });
  };

  // Mở popup Assign hoặc reassign
  const showAssignModal = (epc) => {
    setSelectedEPC(epc);
    setIsModalVisible(true);
  };

  // Xử lý khi chọn sản phẩm
  const handleProductChange = (value) => {
    setSelectedProduct(value);
  };

  // Xác nhận gán hoặc gán lại EPC
  const handleAssign = async () => {
    if (!selectedProduct) {
      message.warning("Vui lòng chọn sản phẩm để gán EPC.");
      return;
    }

    try {
      await axios.post("http://localhost:3003/api/epc/assign", {
        epc: selectedEPC,
        productId: selectedProduct,
      });

      message.success("Gán EPC thành công!");

      // Cập nhật trạng thái EPC trong bảng
      setEpcList((prevList) =>
        prevList.map((item) =>
          item.epc === selectedEPC
            ? {
                ...item,
                productName: products.find((p) => p._id === selectedProduct)
                  .name,
                status: "Assigned",
              }
            : item
        )
      );

      // Đóng modal
      setIsModalVisible(false);
      setSelectedEPC(null);
      setSelectedProduct(null);
    } catch (error) {
      message.error("Lỗi khi gán EPC.");
    }
  };

  // Hủy assign EPC
  const handleUnassign = async (epc) => {
    try {
      await axios.post("http://localhost:3003/api/epc/unassign", { epc });

      message.success("Hủy gán EPC thành công!");

      // Cập nhật trạng thái EPC trong bảng
      setEpcList((prevList) =>
        prevList.map((item) =>
          item.epc === epc
            ? { ...item, productName: "N/A", status: "Unassigned" }
            : item
        )
      );
    } catch (error) {
      message.error("Lỗi khi hủy gán EPC.");
    }
  };

  // Cột cho bảng hiển thị EPC
  const columns = [
    { title: "EPC", dataIndex: "epc", key: "epc" },
    { title: "Product Name", dataIndex: "productName", key: "productName" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Assigned" ? "green" : "red"}>{status}</Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <>
          {record.status === "Unassigned" ? (
            <Button type="primary" onClick={() => showAssignModal(record.epc)}>
              Assign
            </Button>
          ) : (
            <>
              <Button
                type="default"
                onClick={() => showAssignModal(record.epc)}
                style={{ marginRight: 8 }}
              >
                Reassign
              </Button>
              <Button type="danger" onClick={() => handleUnassign(record.epc)}>
                Unassign
              </Button>
            </>
          )}
        </>
      ),
    },
  ];

  return (
    <Card style={{ margin: "20px" }}>
      <Title level={3}>EPC Management - WebSocket</Title>

      {/* Nút bắt đầu và dừng quét */}
      <div style={{ marginBottom: 20 }}>
        <Button
          type="primary"
          onClick={handleStartScan}
          disabled={isScanning}
          style={{ marginRight: 10 }}
        >
          Start Scan
        </Button>
        <Button type="danger" onClick={handleStopScan} disabled={!isScanning}>
          Stop Scan
        </Button>
      </div>

      {/* Bảng hiển thị EPC */}
      <Table
        dataSource={epcList}
        columns={columns}
        rowKey="epc"
        pagination={false}
      />

      {/* Modal Assign EPC */}
      <Modal
        title={`Assign EPC: ${selectedEPC}`}
        visible={isModalVisible}
        onOk={handleAssign}
        onCancel={() => setIsModalVisible(false)}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <Select
          placeholder="Chọn sản phẩm"
          style={{ width: "100%" }}
          onChange={handleProductChange}
        >
          {products.map((product) => (
            <Option key={product._id} value={product._id}>
              {product.name}
            </Option>
          ))}
        </Select>
      </Modal>
    </Card>
  );
};

export default EPCManagement;
