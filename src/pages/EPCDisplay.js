import React, { useState, useRef } from "react";
import { Table, notification, Button, Row, Col, Input, Modal } from "antd";
import axios from "axios";
import SockJS from "sockjs-client";

const EPCDisplay = () => {
  const socketRef = useRef(null); 
  const [invoiceCode, setInvoiceCode] = useState(""); // Mã phiếu
  const [invoiceData, setInvoiceData] = useState(null); // Thông tin phiếu
  const [readData, setReadData] = useState([]); // Dữ liệu đọc được
  const [isReading, setIsReading] = useState(false); // Trạng thái đọc
  const [comparisonResult, setComparisonResult] = useState({
    matched: [],
    extra: [],
    missing: [],  
  });
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleCheckInvoice = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3003/api/transaction/code/${invoiceCode}`
      );
      setInvoiceData(response.data);
      notification.success({
        message: "Thông tin phiếu đã được tải thành công",
      });
    } catch (error) {
      setInvoiceData(null);
      notification.error({
        message: "Không tìm thấy thông tin phiếu",
        description: error.response?.data?.message || error.message,
      });
    }
  };

  const handleStartReading = async () => {
    try {
      // Dừng đọc trước đó nếu cần
      await axios.post("http://localhost:8386/api/nation-rfid/stop");

      // Xóa dữ liệu cũ
      setReadData([]);
      setIsReading(true);

      // Gửi lệnh bắt đầu đọc
      await axios.post("http://localhost:8386/api/nation-rfid/start");
      notification.success({ message: "Bắt đầu đọc EPC" });

      // Ngắt kết nối WebSocket cũ nếu tồn tại
      if (socketRef.current) {
        socketRef.current.close();
      }

      // Kết nối WebSocket để nhận dữ liệu EPC
      const socket = new SockJS("http://localhost:8090/echo");
      socketRef.current = socket; // Lưu tham chiếu WebSocket

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleEPCData(data); // Xử lý dữ liệu quét
      };

      socket.onclose = () => {
        console.log("WebSocket kết nối đã đóng.");
      };
    } catch (error) {
      notification.error({
        message: "Lỗi khi bắt đầu đọc",
        description: error.message,
      });
    }
  };



  const handleStopReading = async () => {
    try {
      await axios.post("http://localhost:8386/api/nation-rfid/stop");
      setIsReading(false);
      notification.success({ message: "Dừng đọc EPC" });

      // Ngắt kết nối WebSocket
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null; // Xóa tham chiếu WebSocket
      }
    } catch (error) {
      notification.error({
        message: "Lỗi khi dừng đọc",
        description: error.message,
      });
    }
  };


  const handleCompare = () => {
    if (!invoiceData) {
      notification.error({
        message: "Không có thông tin phiếu để so sánh",
      });
      return;
    }

    const matched = [];
    const extra = [];
    const missing = [];

    // So sánh dữ liệu quét được với dữ liệu phiếu
    readData.forEach((readItem) => {
      const matchingInvoiceItem = invoiceData.products.find(
        (invoiceItem) => invoiceItem.barcode === readItem.barcode
      );
      if (matchingInvoiceItem) {
        if (matchingInvoiceItem.quantity === readItem.quantity) {
          matched.push(readItem);
        } else {
          extra.push(readItem);
        }
      } else {
        extra.push(readItem);
      }
    });

    invoiceData.products.forEach((invoiceItem) => {
      const matchingReadItem = readData.find(
        (readItem) => readItem.barcode === invoiceItem.barcode
      );
      if (!matchingReadItem) {
        missing.push(invoiceItem);
      }
    });

    setComparisonResult({ matched, extra, missing });
    setIsModalVisible(true);
  };

  const handleEPCData = (epcData) => {
    setReadData((prevData) => {
      // Tìm xem barcode đã tồn tại hay chưa
      const existingIndex = prevData.findIndex(
        (item) => item.barcode === epcData.barcode
      );

      if (existingIndex >= 0) {
        // Nếu barcode đã tồn tại, cập nhật số lượng
        const updatedData = [...prevData];
        updatedData[existingIndex] = {
          ...updatedData[existingIndex],
          quantity: updatedData[existingIndex].quantity + 1,
        };
        return updatedData;
      }

      // Nếu barcode chưa tồn tại, thêm sản phẩm mới
      return [
        ...prevData,
        {
          epc: epcData.epc,
          barcode: epcData.barcode,
          productName: epcData.product
            ? epcData.product.name
            : "Unknown Product",
          categoryName:
            epcData.product && epcData.product.category
              ? epcData.product.category
              : "Unknown Category",
          productImage: epcData.product ? epcData.product.image : null,
          quantity: 1,
        },
      ];
    });
  };


  const columns = [
    {
      title: "Hình Ảnh",
      dataIndex: "productImage",
      key: "productImage",
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
      dataIndex: "productName",
      key: "productName",
    },
    {
      title: "Danh Mục",
      dataIndex: "categoryName",
      key: "categoryName",
    },
    {
      title: "Số Lượng",
      dataIndex: "quantity",
      key: "quantity",
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <Row gutter={[16, 16]} style={{ marginBottom: "20px" }}>
        <Col span={16}>
          <Input
            placeholder="Nhập mã phiếu (PO/SO)"
            value={invoiceCode}
            onChange={(e) => setInvoiceCode(e.target.value)}
          />
        </Col>
        <Col span={8}>
          <Button type="primary" onClick={handleCheckInvoice}>
            Kiểm Tra
          </Button>
        </Col>
      </Row>

      {invoiceData && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Thông Tin Phiếu: {invoiceData.transactionCode}</h3>
          <Table
            dataSource={invoiceData.products}
            columns={columns}
            rowKey="barcode"
            pagination={false}
          />
        </div>
      )}

      <Row justify="space-between" style={{ marginBottom: "20px" }}>
        <Col>
          <h3>Danh Sách EPC Đọc Được</h3>
        </Col>
        <Col>
          <Button
            type="primary"
            onClick={handleStartReading}
            disabled={isReading}
            style={{ marginRight: "10px" }}
          >
            Đọc
          </Button>
          <Button
            type="danger"
            onClick={handleStopReading}
            disabled={!isReading}
            style={{ marginRight: "10px" }}
          >
            Dừng
          </Button>
          <Button type="default" onClick={handleCompare}>
            So Sánh
          </Button>
        </Col>
      </Row>

      <Table
        dataSource={readData}
        columns={columns}
        rowKey="barcode"
        pagination={false}
      />

      <Modal
        title="Kết Quả So Sánh"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <h3>Sản Phẩm Khớp</h3>
        <Table
          dataSource={comparisonResult.matched}
          columns={columns}
          rowKey="barcode"
          pagination={false}
        />

        <h3>Sản Phẩm Lạc</h3>
        <Table
          dataSource={comparisonResult.extra}
          columns={columns}
          rowKey="barcode"
          pagination={false}
        />

        <h3>Sản Phẩm Thiếu</h3>
        <Table
          dataSource={comparisonResult.missing}
          columns={columns}
          rowKey="barcode"
          pagination={false}
        />
      </Modal>
    </div>
  );
};

export default EPCDisplay;
