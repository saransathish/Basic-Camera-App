import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, RecordVideoOptions } from 'react-native-vision-camera';
import * as RNFS from 'react-native-fs';
import Video from 'react-native-video';

const App: React.FC = () => {
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [zoom, setZoom] = useState(0);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<Camera>(null);
  const { hasPermission, requestPermission } = useCameraPermission();

  const device = useCameraDevice(cameraType);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const toggleCameraType = () => {
    setCameraType(prevType => (prevType === 'back' ? 'front' : 'back'));
  };

  const zoomIn = () => {
    setZoom(prevZoom => Math.min(prevZoom + 0.1, 1));
  };

  const zoomOut = () => {
    setZoom(prevZoom => Math.max(prevZoom - 0.1, 0));
  };

  const startRecording = async () => {
    if (cameraRef.current) {
      try {
        setIsRecording(true);
        const options: RecordVideoOptions = {
          onRecordingFinished: async (video) => {
            setMediaUri(`file://${video.path}`);
            setIsRecording(false);
          },
          onRecordingError: (error) => {
            console.error('Failed to record video:', error);
            Alert.alert('Error', 'Failed to record video.');
            setIsRecording(false);
          },
        };
        await cameraRef.current.startRecording(options);
      } catch (error) {
        console.error('Failed to start recording:', error);
        Alert.alert('Error', 'Failed to start recording.');
        setIsRecording(false);
      }
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      try {
        await cameraRef.current.stopRecording();
      } catch (error) {
        console.error('Failed to stop recording:', error);
        Alert.alert('Error', 'Failed to stop recording.');
      }
    }
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePhoto();
        const filePath = photo.path;

        // Create 'capture' directory if it doesn't exist
        const captureFolderPath = `${RNFS.DocumentDirectoryPath}/capture`;
        await RNFS.mkdir(captureFolderPath);

        // Move photo to 'capture' folder
        const newFilePath = `${captureFolderPath}/${new Date().toISOString()}.jpg`;
        await RNFS.moveFile(filePath, newFilePath);

        setMediaUri(`file://${newFilePath}`);
      } catch (error) {
        console.error('Failed to take photo:', error);
        Alert.alert('Error', 'Failed to capture photo.');
      }
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text>Please grant camera permission.</Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.container}>
        <Text>No camera available.</Text>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      {mediaUri ? (
        mediaUri.endsWith('.jpg') ? (
          <Image source={{ uri: mediaUri }} style={StyleSheet.absoluteFill} />
        ) : (
          <Video
            source={{ uri: mediaUri }}
            style={StyleSheet.absoluteFill}
            controls={true}
            resizeMode="contain"
          />
        )
      ) : (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          photo={true}
          video={true}
          device={device}
          isActive={true}
          zoom={zoom}
        />
      )}

      {!mediaUri && (
        <>
          <TouchableOpacity style={styles.button} onPress={toggleCameraType}>
            <Text style={styles.buttonText}>Switch</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.zoomButton]} onPress={zoomIn}>
            <Text style={styles.buttonText}>Zoom In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.zoomButton, styles.zoomOutButton]} onPress={zoomOut}>
            <Text style={styles.buttonText}>Zoom Out</Text>
          </TouchableOpacity>

          {isRecording ? (
            <TouchableOpacity style={styles.captureButton} onPress={stopRecording}>
              <Text style={styles.buttonText}>Stop Recording</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.captureButton} onPress={startRecording}>
              <Text style={styles.buttonText}>Record Video</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.captureButton, { bottom: 100 }]} onPress={takePhoto}>
            <Text style={styles.buttonText}>Capture Photo</Text>
          </TouchableOpacity>
        </>
      )}

      {mediaUri && (
        <TouchableOpacity style={styles.captureButton} onPress={() => setMediaUri(null)}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    padding: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  zoomButton: {
    bottom: 100,
  },
  zoomOutButton: {
    bottom: 160,
  },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    padding: 15,
  },
});

export default App;
