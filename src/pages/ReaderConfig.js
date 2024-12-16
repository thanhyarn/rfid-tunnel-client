import React, { useState, useEffect } from "react";
import { Select, Button, Form, message } from "antd";
import axios from "axios";

const { Option } = Select;

const ReaderConfig = () => {
  const [comPort, setComPort] = useState("COM1");
  const [baudRate, setBaudRate] = useState(9600);
  const [isConnected, setIsConnected] = useState(false);
  const [antennaPower, setAntennaPower] = useState(null);

  const checkConnectionStatus = async () => {
    try {
      const response = await axios.get("http://localhost:7024/Rfid/getInfor");
      setIsConnected(true);
      setAntennaPower({
        powerAnt1: response.data.powerAnt1,
        powerAnt2: response.data.powerAnt2,
        powerAnt3: response.data.powerAnt3,
        powerAnt4: response.data.powerAnt4,
      });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setIsConnected(false);
        setAntennaPower(null);
      } else {
        message.error("Error checking connection status.");
      }
    }
  };

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const handleConnect = async () => {
    try {
      const url = `http://localhost:7024/Rfid/connect?comPort=${encodeURIComponent(
        comPort
      )}&baudRate=${encodeURIComponent(baudRate)}`;
      await axios.get(url);
      message.success("Connected successfully!");
      setIsConnected(true);
      checkConnectionStatus();
    } catch (error) {
      message.error("Failed to connect. Please try again.");
    }
  };

  const handleDisconnect = async () => {
    try {
      await axios.get("http://localhost:7024/Rfid/disconnect");
      message.success("Disconnected successfully!");
      setIsConnected(false);
      setAntennaPower(null);
    } catch (error) {
      message.error("Failed to disconnect. Please try again.");
    }
  };

  return (
    <Form layout="vertical">
      <Form.Item label="Select COM Port">
        <Select
          value={comPort}
          onChange={(value) => setComPort(value)}
          disabled={isConnected}
        >
          {Array.from({ length: 25 }, (_, i) => (
            <Option key={`COM${i + 1}`} value={`COM${i + 1}`}>{`COM${
              i + 1
            }`}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="Select Baud Rate">
        <Select
          value={baudRate}
          onChange={(value) => setBaudRate(value)}
          disabled={isConnected}
        >
          <Option value={9600}>9600bps</Option>
          <Option value={19200}>19200bps</Option>
          <Option value={38400}>38400bps</Option>
          <Option value={57600}>57600bps</Option>
          <Option value={115200}>115200bps</Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          onClick={handleConnect}
          disabled={isConnected}
          style={{ marginRight: "10px" }}
        >
          Connect
        </Button>
        <Button
          type="default"
          onClick={handleDisconnect}
          disabled={!isConnected}
        >
          Disconnect
        </Button>
      </Form.Item>

      {antennaPower && (
        <div>
          <h3>Antenna Power Information:</h3>
          <p>Power Antenna 1: {antennaPower.powerAnt1}</p>
          <p>Power Antenna 2: {antennaPower.powerAnt2}</p>
          <p>Power Antenna 3: {antennaPower.powerAnt3}</p>
          <p>Power Antenna 4: {antennaPower.powerAnt4}</p>
        </div>
      )}
    </Form>
  );
};

export default ReaderConfig;
