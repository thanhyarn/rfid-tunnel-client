import React, { useEffect, useState } from "react";
import {
  Form,
  Select,
  Button,
  Checkbox,
  Input,
  Row,
  Col,
  Card,
  message,
  Typography,
} from "antd";
import axios from "axios";
const { Option } = Select;
const { Title } = Typography;

const ReaderConfig = () => {
  const [antennaValues, setAntennaValues] = useState({});
  const [epcSpeed, setEpcSpeed] = useState(0);
  const [session, setSession] = useState(0);
  const [qv, setQv] = useState(0);
  const [searchType, setSearchType] = useState(0);
  const [frequencyRange, setFrequencyRange] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [comPort, setComPort] = useState("COM21");
  const [baudRate, setBaudRate] = useState(15200);

  const epcSpeedMap = {
    0: "Tari=25us,FM0,LF=40KHz",
    1: "Dense node",
    2: "Tari=25us,Miller4,LHF=300KHz",
    3: "Fast mode",
    255: "Auto",
  };

  const sessionMap = {
    0: "Session 0",
    1: "Session 1",
    2: "Session 2",
    3: "Session 3",
  };

  const qvMap = Array.from({ length: 16 }, (_, i) => ({
    value: i,
    label: `Q-Value ${i}`,
  }));

  const searchTypeMap = {
    0: "Flag A",
    1: "Flag B",
    2: "Flag A & Flag B",
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8386/api/nation-rfid/get-antenna-power"
      );
      setIsConnected(true);
      // setAntennaValues(response.data.antennaPowers);
      handleGetEpcBaseband();
      handleGetFrequencyRange();
      handleGetAntennaPower();
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setIsConnected(false);
        setAntennaValues(null);
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
      await axios.post("http://localhost:8386/api/nation-rfid/connect", {
        ComPort: comPort,
        BaudRate: baudRate,
      });
      message.success("Connected successfully!");
      setIsConnected(true);
      checkConnectionStatus();
    } catch (error) {
      message.error("Failed to connect. Please try again.");
    }
  };

  const handleDisconnect = async () => {
    try {
      await axios.get("http://localhost:8386/api/nation-rfid/disconnect");
      message.success("Disconnected successfully!");
      setIsConnected(false);
      setAntennaValues(null);
    } catch (error) {
      message.error("Failed to disconnect. Please try again.");
    }
  };

  const handleGetEpcBaseband = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8386/api/nation-rfid/get-epc-baseband"
      );
      const data = response.data;

      setEpcSpeed(data.baseSpeed);
      setSession(data.session);
      setQv(data.qValue);
      setSearchType(data.inventoryFlag);
      message.success("EPC Baseband fetched successfully!");
    } catch (error) {
      message.error("Failed to fetch EPC Baseband data.");
    }
  };

  const handleSetEpcBaseband = async () => {
    try {
      await axios.post(
        "http://localhost:8386/api/nation-rfid/set-epc-baseband",
        {
          baseSpeed: epcSpeed,
          session: session,
          qValue: qv,
          inventoryFlag: searchType,
        }
      );
      message.success("EPC Baseband set successfully!");
    } catch (error) {
      message.error("Failed to set EPC Baseband data.");
    }
  };

  const handleGetFrequencyRange = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8386/api/nation-rfid/get-frequency-range"
      );
      const data = response.data;

      // Map frequencyRangeIndex to display labels
      const frequencyRangeMap = {
        0: "National Standard 920~925MHz",
        1: "National Standard 840~845MHz",
        2: "National Standard 840~845MHz and 920~925MHz",
        3: "FCC,902928MHz",
        4: "ETSI,866~868MHz",
        9: "ALL_BAND 802.75~998.75MHz",
      };

      setFrequencyRange(data.frequencyRangeIndex);
      message.success(
        `Frequency range fetched: ${
          frequencyRangeMap[data.frequencyRangeIndex]
        }`
      );
    } catch (error) {
      message.error("Failed to fetch frequency range.");
    }
  };

  const handleSetFrequencyRange = async () => {
    try {
      await axios.post(
        "http://localhost:8386/api/nation-rfid/set-frequency-range",
        {
          FrequencyRangeIndex: frequencyRange,
        }
      );
      message.success("Frequency range set successfully!");
    } catch (error) {
      message.error("Failed to set frequency range.");
    }
  };

  const handleGetAntennaPower = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8386/api/nation-rfid/get-antenna-power"
      );
      const data = response.data;
      const antennaPowers = data.antennaPowers;

      // Map antenna power data into dropdown states
      const updatedAntennaValues = {};
      for (let i = 1; i <= 4; i++) {
        updatedAntennaValues[i] = {
          checked: true,
          value: antennaPowers[i.toString()] || 1, // Default to 1 if undefined
        };
      }

      setAntennaValues(updatedAntennaValues);
      message.success("Antenna power fetched successfully!");
    } catch (error) {
      message.error("Failed to fetch antenna power.");
    }
  };

  const handleSetAntennaPower = async () => {
    try {
      const powerSettings = Object.entries(antennaValues)
        .filter(([_, antenna]) => antenna.checked)
        .reduce((acc, [key, antenna]) => {
          acc[key] = antenna.value;
          return acc;
        }, {});

      const payload = {
        PowerSettings: powerSettings,
      };

      await axios.post(
        "http://localhost:8386/api/nation-rfid/set-antenna-power",
        payload
      );
      message.success("Antenna power set successfully!");
    } catch (error) {
      message.error("Failed to set antenna power.");
    }
  };

  return (
    <div
      style={{ padding: 12, minHeight: "100vh", backgroundColor: "#f4f6f8" }}
    >
      <Card
        title={<Title level={4}>RFID Reader Configuration</Title>}
        style={{ margin: "0 auto", maxWidth: 800 }}
        bodyStyle={{ padding: 16 }}
      >
        <Form layout="vertical">
          <Title level={5}>Connection Settings</Title>

          <Row justify="start" style={{ marginBottom: 16 }}>
            <Col>
              <Button
                type="primary"
                onClick={handleConnect}
                disabled={isConnected}
                style={{ marginRight: 8 }}
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
            </Col>
          </Row>

          {isConnected && (
            <>
              <Title level={5} style={{ marginTop: 16 }}>
                EPC Baseband
              </Title>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item label="EPC Speed">
                    <Select
                      value={epcSpeed}
                      onChange={setEpcSpeed}
                      optionLabelProp="label"
                    >
                      {Object.entries(epcSpeedMap).map(([value, label]) => (
                        <Option
                          key={value}
                          value={parseInt(value)}
                          label={label}
                        >
                          {label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item label="Session">
                    <Select value={session} onChange={setSession}>
                      {Object.entries(sessionMap).map(([value, label]) => (
                        <Option key={value} value={parseInt(value)}>
                          {label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item label="QV">
                    <Select value={qv} onChange={setQv}>
                      {qvMap.map((item) => (
                        <Option key={item.value} value={item.value}>
                          {item.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item label="Search Type">
                    <Select value={searchType} onChange={setSearchType}>
                      {Object.entries(searchTypeMap).map(([value, label]) => (
                        <Option key={value} value={parseInt(value)}>
                          {label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row justify="start" style={{ marginBottom: 16 }}>
                <Col>
                  <Button
                    type="primary"
                    onClick={handleGetEpcBaseband}
                    style={{ marginRight: 8 }}
                  >
                    Get
                  </Button>
                  <Button type="default" onClick={handleSetEpcBaseband}>
                    Set
                  </Button>
                </Col>
              </Row>

              <Title level={5} style={{ marginTop: 16 }}>
                Frequency Range
              </Title>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Frequency Range">
                    <Select value={frequencyRange} onChange={setFrequencyRange}>
                      <Option value={0}>National Standard 920~925MHz</Option>
                      <Option value={1}>National Standard 840~845MHz</Option>
                      <Option value={2}>
                        National Standard 840~845MHz and 920~925MHz
                      </Option>
                      <Option value={3}>FCC,902928MHz</Option>
                      <Option value={4}>ETSI,866~868MHz</Option>
                      <Option value={9}>ALL_BAND 802.75~998.75MHz</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} style={{ display: "flex", gap: 8 }}>
                  <Button type="primary" onClick={handleGetFrequencyRange}>
                    Get
                  </Button>
                  <Button type="default" onClick={handleSetFrequencyRange}>
                    Set
                  </Button>
                </Col>
              </Row>

              <Title level={5} style={{ marginTop: 16 }}>
                ANT Power
              </Title>
              <Row gutter={[16, 16]}>
                {Array.from({ length: 4 }, (_, i) => (
                  <Col xs={12} sm={6} key={i + 1}>
                    <Form.Item label={`ANT${i + 1}`}>
                      <Select
                        value={antennaValues[i + 1]?.value || 1}
                        onChange={(value) =>
                          setAntennaValues((prev) => ({
                            ...prev,
                            [i + 1]: { ...prev[i + 1], value },
                          }))
                        }
                      >
                        {Array.from({ length: 33 }, (_, v) => (
                          <Option key={v + 1} value={v + 1}>
                            {v + 1}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                ))}
              </Row>
              <Row justify="start" style={{ marginTop: 16 }}>
                <Col>
                  <Button
                    type="primary"
                    onClick={handleGetAntennaPower}
                    style={{ marginRight: 8 }}
                  >
                    Get
                  </Button>
                  <Button type="default" onClick={handleSetAntennaPower}>
                    Set
                  </Button>
                </Col>
              </Row>
            </>
          )}
        </Form>
      </Card>
    </div>
  );
};

export default ReaderConfig;
