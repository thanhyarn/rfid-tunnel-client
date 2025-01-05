import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Row,
  Col,
  Card,
  Button,
  List,
  Avatar,
  Typography,
  InputNumber,
  Radio,
  message,
} from "antd";
import { jsPDF } from "jspdf";
import { RobotoNormal } from "../fonts.js"; // Import font Base64

const { Title } = Typography;

const ProductManager = () => {
  const [products, setProducts] = useState([]); // List of products from API
  const [cart, setCart] = useState([]); // Items added to the cart
  const [transactionType, setTransactionType] = useState("import"); // "import" or "export"

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3003/api/product/fetch-all"
        );
        setProducts(response.data); // Assume the API returns an array of products
      } catch (error) {
        console.error("Error fetching products:", error);
        message.error("Failed to fetch products.");
      }
    };

    fetchProducts();
  }, []);

  // Add product to cart
  const addToCart = (product) => {
    const existingProduct = cart.find((item) => item._id === product._id);
    if (existingProduct) {
      // Increase quantity if product already exists in the cart
      const updatedCart = cart.map((item) =>
        item._id === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      setCart(updatedCart);
    } else {
      // Add product to cart with quantity 1
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    message.success(`${product.name} added to cart!`);
  };

  // Update product quantity in the cart
  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return;
    const updatedCart = cart.map((item) =>
      item._id === productId ? { ...item, quantity } : item
    );
    setCart(updatedCart);
  };

  // Remove product from cart
  const removeFromCart = (productId) => {
    const updatedCart = cart.filter((item) => item._id !== productId);
    setCart(updatedCart);
    message.info("Item removed from cart.");
  };

  // Generate PDF directly from cart
  const submitTransaction = async () => {
    if (cart.length === 0) {
      message.warning("Cart is empty! Please add some products.");
      return;
    }

    const doc = new jsPDF("p", "mm", "a4");
    doc.addFileToVFS("Roboto-Regular.ttf", RobotoNormal);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.setFont("Roboto");

    let y = 20; // Initial Y position for PDF content

    // Add title and transaction type
    doc.setFontSize(16);
    doc.text("Transaction Receipt", 105, y, { align: "center" });
    y += 10;

    // Add transaction code
    const transactionCode = `TRX-${Date.now()}`;
    doc.setFontSize(12);
    doc.text(`Transaction Code: ${transactionCode}`, 10, y);
    y += 10;

    doc.text(`Transaction Type: ${transactionType.toUpperCase()}`, 10, y);
    y += 10;

    // Add table headers
    doc.setFontSize(10);
    doc.text("Image", 10, y);
    doc.text("Product Name", 60, y);
    doc.text("Quantity", 150, y);
    y += 10;

    // Draw content for each item in cart
    cart.forEach((item) => {
      if (y > 280) {
        // Add new page if content exceeds page height
        doc.addPage();
        y = 20;
      }

      // Add product image
      if (item.image) {
        const img = new Image();
        img.src = item.image;
        doc.addImage(img, "JPEG", 10, y - 8, 30, 30); // Adjust size and position
      }

      // Add product name and quantity
      doc.text(item.name, 60, y + 10);
      doc.text(`${item.quantity}`, 150, y + 10);

      y += 40; // Adjust Y position for next item
    });

    // Save the PDF
    doc.save(`transaction-${transactionCode}.pdf`);
    message.success("Transaction PDF generated successfully!");
  };

  return (
    <div style={{ padding: "20px" }}>
      <Row gutter={[20, 20]}>
        {/* Left panel: Product list */}
        <Col span={12}>
          <Card
            title="Available Products"
            bordered={true}
            style={{ height: "100%" }}
          >
            <Row gutter={[16, 16]}>
              {products.map((product) => (
                <Col key={product._id} xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    cover={
                      <img
                        alt={product.name}
                        src={product.image || "https://via.placeholder.com/150"}
                        style={{
                          height: "150px",
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                      />
                    }
                    actions={[
                      <Button
                        type="primary"
                        onClick={() => addToCart(product)}
                        block
                      >
                        Add
                      </Button>,
                    ]}
                  >
                    <Card.Meta
                      title={product.name}
                      description={
                        product.description || "No description available"
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* Right panel: Cart */}
        <Col span={12}>
          <Card
            title={
              <div>
                <Radio.Group
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value)}
                >
                  <Radio.Button value="import">Import</Radio.Button>
                  <Radio.Button value="export">Export</Radio.Button>
                </Radio.Group>
              </div>
            }
            bordered={true}
            style={{ height: "100%" }}
          >
            {cart.length === 0 ? (
              <Typography.Text>No items added yet.</Typography.Text>
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={cart}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <InputNumber
                        min={1}
                        value={item.quantity}
                        onChange={(value) => updateQuantity(item._id, value)}
                      />,
                      <Button
                        type="link"
                        danger
                        onClick={() => removeFromCart(item._id)}
                      >
                        Remove
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          src={item.image || "https://via.placeholder.com/150"}
                        />
                      }
                      title={item.name}
                      description={`Quantity: ${item.quantity}`}
                    />
                  </List.Item>
                )}
              />
            )}
            <Button
              type="primary"
              block
              style={{ marginTop: "20px" }}
              disabled={cart.length === 0}
              onClick={submitTransaction}
            >
              Submit Transaction
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProductManager;
