import React, { Component } from 'react';
import {
  Container,
  Header,
  Title,
  Footer,
  FooterTab,
  Button,
  Left,
  Right,
  Body,
  Icon,
  Text,
  Item,
  Input
} from 'native-base';
import {
  KeyboardAvoidingView,
  TouchableHighlight,
  View,
  Platform,
  ScrollView
} from 'react-native';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import { getStatusBarHeight } from 'react-native-status-bar-height';

const monospaceFont = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

type Props = {};

type State = {
  location: string;
  message: string;
  connected: boolean;
  log: any[];
};

export default class Root extends Component<Props, State> {
  state: State;
  client: W3CWebSocket;
  scrollView: any;

  constructor(props: Props) {
    super(props);

    this.state = {
      location: 'ws://echo.websocket.org',
      message: '',
      connected: false,
      log: []
    };

    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.send = this.send.bind(this);
    this.initListeners = this.initListeners.bind(this);
    this.log = this.log.bind(this);
  }

  connect() {
    const { location, connected } = this.state;

    if (connected) {
      return;
    }

    console.log(`connect to: ${location}`);

    this.client = new W3CWebSocket(location);
    this.initListeners();
  }

  initListeners() {
    this.client.onopen = () => {
      const { location } = this.state;
      console.log('Connected to websocket');
      this.setState({
        connected: true
      });
      this.log('system', `Connected to ${location}`);
    };
    this.client.onmessage = message => {
      const { data } = message;
      console.log(`incoming message: ${data}`);
      this.log('in', data);
    };
    this.client.onerror = () => {
      console.log('error occurred');
      this.log('error', 'An error occurred while connecting to the websocket.');
    };
    this.client.onclose = () => {
      const { location } = this.state;
      console.log('connection closed');
      this.setState({
        connected: false
      });
      this.log('system', `Disconnected from ${location}`);
    };
  }

  log(type: string, data: string) {
    const { log } = this.state;
    log.push({ type, data });

    this.setState({
      log
    });
  }

  disconnect() {
    console.log('disconnect');

    const { connected } = this.state;

    if (!connected) {
      return;
    }

    this.client.close();
  }

  send(event: any) {
    event.preventDefault();

    const { message, connected } = this.state;

    if (!connected) {
      this.log('warning', 'Connect to a websocket first!');
      return;
    }

    if (message.trim() === '') {
      return;
    }

    console.log(`send message: ${message}`);
    this.client.send(message);
    this.log('out', message);

    this.setState({
      message: ''
    });
  }

  render() {
    const { location, message, connected, log } = this.state;

    return (
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Container style={{ backgroundColor: 'hsl(0, 0%, 14%)' }}>
          <Header
            style={{
              paddingTop: getStatusBarHeight(),
              height: 54 + getStatusBarHeight(),
              backgroundColor: 'hsl(0, 0%, 4%)'
            }}
          >
            <Left>
              <Button transparent>
                <Icon name="menu" />
              </Button>
            </Left>
            <Body>
              <Title>WebSocket Tester</Title>
            </Body>
            <Right />
          </Header>
          <ScrollView
            ref={ref => (this.scrollView = ref)}
            onContentSizeChange={() => this.scrollView.scrollToEnd()}
            style={{ flex: 1 }}
            stickyHeaderIndices={[0]}
          >
            <View style={{ backgroundColor: 'hsl(0, 0%, 7%)' }}>
              <Item>
                <Input
                  value={location}
                  onSubmitEditing={this.connect}
                  onChangeText={location => this.setState({ location })}
                  style={{ color: 'hsl(0, 0%, 98%)' }}
                />
                {connected ? (
                  <TouchableHighlight
                    onPress={this.disconnect}
                    underlayColor="hsl(0, 0%, 7%)"
                  >
                    <Text style={{ color: 'hsl(217, 71%, 53%)' }}>
                      Disconnect&nbsp;&nbsp;
                    </Text>
                  </TouchableHighlight>
                ) : (
                  <TouchableHighlight
                    onPress={this.connect}
                    underlayColor="hsl(0, 0%, 7%)"
                  >
                    <Text style={{ color: 'hsl(217, 71%, 53%)' }}>
                      Connect&nbsp;&nbsp;
                    </Text>
                  </TouchableHighlight>
                )}
              </Item>
            </View>
            <View style={{ paddingLeft: '2%', paddingRight: '2%' }}>
              {log.map((line, index) => {
                const { type, data } = line;

                let isValidJSON;
                let jsonMessage;

                try {
                  jsonMessage = JSON.parse(data);
                  isValidJSON = true;
                } catch (error) {
                  isValidJSON = false;
                }

                switch (type) {
                  case 'system':
                    return (
                      <Text
                        key={index}
                        style={{
                          color: 'hsl(204, 71%, 53%)',
                          fontFamily: monospaceFont
                        }}
                        selectable={true}
                      >
                        {data}
                      </Text>
                    );
                  case 'out':
                    return (
                      <Text
                        key={index}
                        style={{
                          color: 'hsl(14, 100%, 53%)',
                          fontFamily: monospaceFont
                        }}
                        selectable={true}
                      >
                        {isValidJSON
                          ? JSON.stringify(jsonMessage, null, 2)
                          : data}
                      </Text>
                    );
                  case 'in':
                    return (
                      <Text
                        key={index}
                        style={{
                          color: 'hsl(0, 0%, 98%)',
                          fontFamily: monospaceFont
                        }}
                        selectable={true}
                      >
                        {isValidJSON
                          ? JSON.stringify(jsonMessage, null, 2)
                          : data}
                      </Text>
                    );
                  case 'warning':
                    return (
                      <Text
                        key={index}
                        style={{
                          color: 'hsl(48, 100%, 67%)',
                          fontFamily: monospaceFont
                        }}
                        selectable={true}
                      >
                        {data}
                      </Text>
                    );
                  case 'error':
                    return (
                      <Text
                        key={index}
                        style={{
                          color: 'hsl(14, 100%, 53%)',
                          fontFamily: monospaceFont
                        }}
                        selectable={true}
                      >
                        {data}
                      </Text>
                    );
                  default:
                    return (
                      <Text
                        key={index}
                        selectable={true}
                        style={{
                          color: 'hsl(0, 0%, 4%)',
                          fontFamily: monospaceFont
                        }}
                      >
                        {data}
                      </Text>
                    );
                }
              })}
            </View>
          </ScrollView>
          <Footer>
            <FooterTab style={{ backgroundColor: 'hsl(0, 0%, 7%)' }}>
              <Input
                placeholder="Enter Message"
                value={message}
                onChangeText={message => this.setState({ message })}
                onSubmitEditing={this.send}
                style={{ color: 'hsl(0, 0%, 98%)' }}
              />
            </FooterTab>
          </Footer>
        </Container>
      </KeyboardAvoidingView>
    );
  }
}
