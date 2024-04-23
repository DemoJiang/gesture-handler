import {TestCase, TestSuite} from '@rnoh/testerino';
import {
  createNativeWrapper,
  TouchableHighlight,
  enableLegacyWebImplementation,
  enableExperimentalWebImplementation,
  TouchableNativeFeedback,
} from 'react-native-gesture-handler';
import {StyleSheet, Text, View, Platform} from 'react-native';
import {PALETTE} from '../constants';

const RNGHView = createNativeWrapper(View, {
  disallowInterruption: true,
});

export function SharedAPITest() {
  return (
    <TestSuite name="shared API">
      <TestCase
        itShould="do nothing when calling enableLegacyWebImplementation"
        fn={() => {
          enableLegacyWebImplementation();
        }}
      />
      <TestCase
        itShould="do nothing when calling enableExperimentalWebImplementation"
        fn={() => {
          enableExperimentalWebImplementation();
        }}
      />
      <TestCase
        itShould="pass on press (createNativeWrapper)"
        initialState={false}
        arrange={({setState}) => {
          return (
            <View style={styles.testCaseContainer}>
              <RNGHView
                style={{
                  height: 128,
                  width: 128,
                  backgroundColor: PALETTE.DARK_BLUE,
                  justifyContent: 'center',
                }}
                onBegan={() => {
                  setState(true);
                }}>
                <Text
                  style={{color: 'white', fontSize: 12, textAlign: 'center'}}>
                  PRESS ME
                </Text>
              </RNGHView>
            </View>
          );
        }}
        assert={({expect, state}) => {
          expect(state).to.be.eq(true);
        }}
      />
      <TestCase
        itShould="change color to red when pressing the button (TouchableHighlight)"
        initialState={false}
        arrange={({setState}) => {
          return (
            <TouchableHighlight
              style={{backgroundColor: PALETTE.DARK_BLUE, paddingVertical: 16}}
              underlayColor={PALETTE.DARK_RED}
              onPress={() => {
                setState(true);
              }}>
              <Text style={{color: 'white', textAlign: 'center'}}>
                PRESS ME
              </Text>
            </TouchableHighlight>
          );
        }}
        assert={({expect, state}) => {
          expect(state).to.be.true;
        }}
      />
      <TestCase
        itShould="ripple on press"
        skip={Platform.OS === 'android' ? false : 'android component'}
        initialState={false}
        arrange={({setState}) => {
          return (
            <>
              <TouchableNativeFeedback
                style={{
                  backgroundColor: PALETTE.DARK_BLUE,
                  paddingVertical: 16,
                }}
                onPress={() => {
                  setState(true);
                }}>
                <Text style={{color: 'white', textAlign: 'center'}}>
                  PRESS ME
                </Text>
              </TouchableNativeFeedback>
            </>
          );
        }}
        assert={({expect, state}) => {
          expect(state).to.be.true;
        }}
      />
    </TestSuite>
  );
}

const styles = StyleSheet.create({
  testCaseContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
});
