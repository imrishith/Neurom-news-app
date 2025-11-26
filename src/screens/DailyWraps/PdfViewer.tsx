// components/PdfViewer.tsx
import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import Pdf from "react-native-pdf";
import RNFS from "react-native-fs"; // Import react-native-fs
import { useTheme } from "../../context/ThemeContext";
import { fh, ff } from "../../../utils/responsive";

interface PdfViewerProps {
 url: string;
}

const PdfViewer = ({ url }: PdfViewerProps) => {
 const { Colors } = useTheme();
 const [localPdfPath, setLocalPdfPath] = useState<string | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
  const downloadAndLoadPdf = async () => {
   setLoading(true);
   setError(null);
   const filename = url.substring(url.lastIndexOf("/") + 1);
   const localFilePath = `${RNFS.CachesDirectoryPath}/${filename}`;

   try {
    // Check if file already exists in cache
    const fileExists = await RNFS.exists(localFilePath);

    if (fileExists) {
    
     setLocalPdfPath(localFilePath);
    } else {
   
     await RNFS.downloadFile({
      fromUrl: url,
      toFile: localFilePath,
      discretionary: true,
     }).promise;
   
     setLocalPdfPath(localFilePath);
    }
   } catch (err) {
    console.error("❌ PDF download/load error:", err);
    setError("Failed to load PDF. Please try again.");
   } finally {
    setLoading(false);
   }
  };

  downloadAndLoadPdf();
 }, [url]);

 if (loading) {
  return (
   <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color={Colors.lavenderPurple} />
    <Text style={[styles.loadingText, { color: Colors.gray }]}>
     Loading PDF...
    </Text>
   </View>
  );
 }

 if (error) {
  return (
   <View style={styles.centerContainer}>
    <Text style={[styles.errorText, { color: Colors.errorColor }]}>
     {error}
    </Text>
   </View>
  );
 }

 return (
  <View style={styles.container}>
   {localPdfPath && (
    <Pdf
     source={{ uri: `file://${localPdfPath}` }}
     style={styles.pdf}
          horizontal={true}  
          pagingEnabled={true} 
     onLoadComplete={(pages) => {
     
     }}
     onError={(err) => {
      console.error("❌ PDF rendering error:", err);
      setError("Could not render PDF. It may be corrupted.");
     }}
    />
   )}
  </View>
 );
};

const styles = StyleSheet.create({
 container: {
  flex: 1,
  backgroundColor: "#111",
 },
 centerContainer: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#111",
 },
 pdf: {
  flex: 1,
  width: "100%",
  height: "100%",
 },
 loadingText: {
  marginTop: fh(10),
  fontSize: ff(14),
 },
 errorText: {
  fontSize: ff(14),
  fontWeight: "600",
 },
});

export default PdfViewer;