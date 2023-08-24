/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {TestCase, TestSuite, Tester} from '@rnoh/testerino';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  GestureType,
  PanGestureHandler,
  State,
  TapGestureHandler,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native-gesture-handler';

function App({}): JSX.Element {
  return (
    <GestureHandlerRootView>
      <ScrollView style={[styles.container]}>
        <Tester>
          <TestSuite name="react-native-gesture-handler">
            <TestCase itShould="toggle color on tap">
              <Example
                createGesture={setBackgroundColor => {
                  return Gesture.Tap().onStart(() => {
                    setBackgroundColor(prev =>
                      prev === 'red' ? 'green' : 'red',
                    );
                  });
                }}
              />
            </TestCase>
            <TestCase itShould="change color to green when panning">
              <Example
                createGesture={setBackgroundColor => {
                  return Gesture.Pan()
                    .onStart(() => {
                      setBackgroundColor('green');
                    })
                    .onEnd(() => {
                      setBackgroundColor('red');
                    });
                }}
              />
            </TestCase>
            <TestCase itShould="support TouchableOpacity">
              <StateKeeper<string>
                renderContent={(value, setValue) => {
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        setValue(prev =>
                          prev === 'Pressed' ? 'Pressed x' : 'Pressed',
                        );
                      }}>
                      <Text
                        style={{
                          width: 256,
                          height: 32,
                          borderWidth: 1,
                          fontSize: 12,
                        }}>
                        {value ?? 'Press me'}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </TestCase>
            <TestCase itShould="support TouchableWithoutFeedback">
              <StateKeeper<string>
                renderContent={(value, setValue) => {
                  return (
                    <TouchableWithoutFeedback
                      onPress={() => {
                        setValue(prev =>
                          prev === 'Pressed' ? 'Pressed x' : 'Pressed',
                        );
                      }}>
                      <Text
                        style={{
                          width: 256,
                          height: 32,
                          borderWidth: 1,
                          fontSize: 12,
                        }}>
                        {value ?? 'Press me'}
                      </Text>
                    </TouchableWithoutFeedback>
                  );
                }}
              />
            </TestCase>
          </TestSuite>
          <TestSuite name="old API">
            <TestCase itShould="toggle color on double tap">
              <TapExample />
            </TestCase>
            <TestCase itShould="change color to green when panning after 50 px in X direction">
              <PanningExample />
            </TestCase>
            <TestCase itShould="display event received by onGestureEvent when dragging over blue rectangle">
              <ObjectDisplayer
                renderContent={setObject => {
                  return (
                    <PanGestureHandler
                      onGestureEvent={e => {
                        setObject({
                          absoluteX: e.nativeEvent.absoluteX,
                          absoluteY: e.nativeEvent.absoluteY,
                          handlerTag: e.nativeEvent.handlerTag,
                          numberOfPointers: e.nativeEvent.numberOfPointers,
                          state: e.nativeEvent.state,
                          translationX: e.nativeEvent.translationX,
                          translationY: e.nativeEvent.translationY,
                          velocityX: e.nativeEvent.velocityX,
                          velocityY: e.nativeEvent.velocityY,
                          x: e.nativeEvent.x,
                          y: e.nativeEvent.y,
                        });
                      }}>
                      <View
                        style={{
                          width: 100,
                          height: 32,
                          backgroundColor: 'blue',
                        }}
                      />
                    </PanGestureHandler>
                  );
                }}
              />
            </TestCase>
            <TestCase itShould="display event received by onHandlerStateChange when dragging over blue rectangle">
              <ObjectDisplayer
                renderContent={setObject => {
                  return (
                    <PanGestureHandler
                      onHandlerStateChange={e => {
                        setObject({
                          oldState: e.nativeEvent.oldState,
                          state: e.nativeEvent.state,
                          absoluteX: e.nativeEvent.absoluteX,
                          absoluteY: e.nativeEvent.absoluteY,
                          handlerTag: e.nativeEvent.handlerTag,
                          numberOfPointers: e.nativeEvent.numberOfPointers,
                          translationX: e.nativeEvent.translationX,
                          translationY: e.nativeEvent.translationY,
                          velocityX: e.nativeEvent.velocityX,
                          velocityY: e.nativeEvent.velocityY,
                          x: e.nativeEvent.x,
                          y: e.nativeEvent.y,
                        });
                      }}>
                      <View
                        style={{
                          width: 100,
                          height: 32,
                          backgroundColor: 'blue',
                        }}
                      />
                    </PanGestureHandler>
                  );
                }}
              />
            </TestCase>
            <TestCase
              itShould="export State object"
              fn={({expect}) => {
                expect(State).to.be.not.undefined;
              }}
            />
            <TestCase itShould="change text when panning on green rect (hit slop)">
              <StateKeeper<string>
                renderContent={(value, setValue) => {
                  return (
                    <PanGestureHandler
                      hitSlop={{right: -64}}
                      onActivated={() =>
                        setValue(prev =>
                          prev === 'Panned' ? 'Panned again' : 'Panned',
                        )
                      }>
                      <View
                        style={{
                          backgroundColor: 'red',
                          width: 128,
                        }}>
                        <Text
                          style={{
                            width: 64,
                            height: 32,
                            borderWidth: 1,
                            fontSize: 12,
                            backgroundColor: 'green',
                          }}>
                          {value ?? 'Pan me'}
                        </Text>
                      </View>
                    </PanGestureHandler>
                  );
                }}
              />
            </TestCase>
            <TestCase itShould="change color when panning left rect but not right">
              <View
                style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <StateKeeper<string>
                  renderContent={(value, setValue) => {
                    return (
                      <PanGestureHandler
                        onActivated={() => setValue('green')}
                        onEnded={() => {
                          setValue('red');
                        }}>
                        <View
                          style={{
                            backgroundColor: value ?? 'red',
                            width: 128,
                            height: 64,
                          }}
                        />
                      </PanGestureHandler>
                    );
                  }}
                />
                <StateKeeper<string>
                  renderContent={(value, setValue) => {
                    return (
                      <PanGestureHandler
                        enabled={false}
                        onActivated={() => setValue('green')}
                        onEnded={() => {
                          setValue('red');
                        }}>
                        <View
                          style={{
                            backgroundColor: value ?? 'red',
                            width: 128,
                            height: 64,
                          }}
                        />
                      </PanGestureHandler>
                    );
                  }}
                />
              </View>
            </TestCase>
            <TestCase itShould="change color on tap as long as finger didn't move more than 100px horizontally (maxDeltaX)">
              <StateKeeper<string>
                renderContent={(value, setValue) => {
                  return (
                    <TapGestureHandler
                      maxDeltaX={100}
                      onActivated={() =>
                        setValue(prev => (prev === 'red' ? 'green' : 'red'))
                      }>
                      <View
                        style={{
                          backgroundColor: 'gray',
                          width: 128,
                          height: 64,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <View
                          style={{
                            backgroundColor: value ?? 'red',
                            width: 100,
                            height: 64,
                          }}
                        />
                      </View>
                    </TapGestureHandler>
                  );
                }}
              />
            </TestCase>
            <TestCase itShould="activate panning after moving more than 50px horizontally (activeOffsetX)">
              <StateKeeper<string>
                renderContent={(value, setValue) => {
                  return (
                    <PanGestureHandler
                      activeOffsetX={[-50, 50]}
                      onActivated={() => setValue('green')}
                      onEnded={() => {
                        setValue('red');
                      }}>
                      <View
                        style={{
                          backgroundColor: value ?? 'red',
                          width: 128,
                          height: 128,
                        }}>
                        <Text style={{width: '100%', height: '100%'}}>
                          (This view has size of 128px)
                        </Text>
                      </View>
                    </PanGestureHandler>
                  );
                }}
              />
            </TestCase>
          </TestSuite>
        </Tester>
      </ScrollView>
    </GestureHandlerRootView>
  );
}

function Example(props: {
  createGesture: (
    setColor: React.Dispatch<React.SetStateAction<string>>,
  ) => GestureType;
  rightHitSlop?: number;
}) {
  const [backgroundColor, setBackgroundColor] = useState('red');

  const gesture = React.useMemo(() => {
    return props.createGesture(setBackgroundColor);
  }, []);

  return (
    <GestureDetector gesture={gesture}>
      <View style={{width: 100, height: 32, backgroundColor}} />
    </GestureDetector>
  );
}

function TapExample() {
  const [backgroundColor, setBackgroundColor] = useState('red');

  return (
    <TapGestureHandler
      numberOfTaps={2}
      onActivated={() => {
        setBackgroundColor(prev => (prev === 'red' ? 'green' : 'red'));
      }}>
      <View style={{width: 100, height: 32, backgroundColor}} />
    </TapGestureHandler>
  );
}

function PanningExample() {
  const [backgroundColor, setBackgroundColor] = useState('red');

  return (
    <PanGestureHandler
      activeOffsetX={[-50, 50]}
      onActivated={() => {
        setBackgroundColor('green');
      }}
      onEnded={() => setBackgroundColor('red')}>
      <View style={{width: 100, height: 32, backgroundColor}} />
    </PanGestureHandler>
  );
}

function ObjectDisplayer(props: {
  renderContent: (setObject: (obj: Object) => void) => any;
}) {
  const [object, setObject] = useState<Object>();

  return (
    <View style={{width: 256, height: 200}}>
      <Text
        style={{width: 256, height: 128, fontSize: 8, backgroundColor: '#EEE'}}>
        {object === undefined ? 'undefined' : JSON.stringify(object)}
      </Text>
      {props.renderContent(setObject)}
    </View>
  );
}

function StateKeeper<T>(props: {
  renderContent: (
    value: T | undefined,
    setValue: React.Dispatch<React.SetStateAction<T | undefined>>,
  ) => void;
}) {
  const [value, setValue] = useState<T>();

  return <>{props.renderContent(value, setValue)}</>;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
  },
});

export default App;
