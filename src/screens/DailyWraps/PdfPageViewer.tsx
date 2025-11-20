import React, { useEffect, useState, useRef } from "react";
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  Text, 
  Dimensions,
  AppState,
  AppStateStatus
} from "react-native";
import Pdf from "react-native-pdf";
import RNFS from "react-native-fs";
import { useTheme } from "../../context/ThemeContext";
import { fh, ff } from "../../../utils/responsive";

interface PdfPagerViewerProps {
  url: string;
  isActive?: boolean; // 🔥 CRITICAL: Control rendering
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  onLoadComplete?: (numberOfPages: number) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_H } = Dimensions.get("window");

const PdfPagerViewer = ({ 
  url, 
  isActive = true, 
  onSwipeStart, 
  onSwipeEnd,
  onLoadComplete 
}: PdfPagerViewerProps) => {
  const { Colors } = useTheme();
  const pdfRef = useRef<Pdf>(null);
  const [localPdfPath, setLocalPdfPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [appState, setAppState] = useState(AppState.currentState);

  // 🔥 Cleanup downloaded files on unmount
  useEffect(() => {
    return () => {
      if (localPdfPath) {
        RNFS.unlink(localPdfPath).catch(err => {
         
        });
      }
    };
  }, [localPdfPath]);

  // 🔥 Handle app background/foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // 🔥 Download PDF only when active and app is in foreground
  useEffect(() => {
    if (!isActive || appState !== 'active') {
      setLoading(false);
      return;
    }

    const downloadAndLoadPdf = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const filename = `pdf_${Date.now()}_${url.substring(url.lastIndexOf("/") + 1)}`;
        const localFilePath = `${RNFS.CachesDirectoryPath}/${filename}`;

        const fileExists = await RNFS.exists(localFilePath);
        if (fileExists) {
          setLocalPdfPath(localFilePath);
        } else {
          const downloadResult = await RNFS.downloadFile({
            fromUrl: url,
            toFile: localFilePath,
            background: true,
            discretionary: true,
            progress: (res) => {
              const progress = (res.bytesWritten / res.contentLength) * 100;
       
            }
          }).promise;

          if (downloadResult.statusCode === 200) {
            setLocalPdfPath(localFilePath);
          } else {
            throw new Error(`Download failed with status: ${downloadResult.statusCode}`);
          }
        }
      } catch (err) {
        console.error("❌ PDF download/load error:", err);
        setError("Failed to load PDF. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    downloadAndLoadPdf();
  }, [url, isActive, appState]);

  // 🔥 Reset PDF when becomes inactive
  useEffect(() => {
    if (!isActive && pdfRef.current && currentPage !== 1) {
      // Reset to first page when not active to save memory
      setCurrentPage(1);
    }
  }, [isActive, currentPage]);

  const handleLoadComplete = (numberOfPages: number) => {
    setTotalPages(numberOfPages);
    onLoadComplete?.(numberOfPages);
  };

  const handlePageChange = (page: number, numberOfPages: number) => {
    setCurrentPage(page);
    setTotalPages(numberOfPages);
    onSwipeEnd?.();
  };

  // 🔥 Show placeholder when not active
  if (!isActive) {
    return (
      <View style={styles.placeholder}>
        <Text style={[styles.placeholderText, { color: Colors.gray }]}>
          PDF {currentPage}/{totalPages}
        </Text>
      </View>
    );
  }

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
        <Text 
          style={[styles.retryText, { color: Colors.lavenderPurple }]}
          onPress={() => {
            setError(null);
            setLoading(true);
            // Retry logic will trigger from useEffect
          }}
        >
          Tap to retry
        </Text>
      </View>
    );
  }

  if (!localPdfPath) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.errorText, { color: Colors.errorColor }]}>
          PDF path not available
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isActive ? (
        <Pdf
          key={`${localPdfPath}`}
          ref={pdfRef}
          source={{ 
            uri: `file://${localPdfPath}`,
            cache: true // Enable built-in caching
          }}
          style={styles.pdf}
          horizontal={true}
          enablePaging={true}
          fitPolicy={0} // Fit to width
          minScale={0.5}
          maxScale={3.0}
          spacing={10}
          onLoadComplete={handleLoadComplete}
          onPageChanged={handlePageChange}
          onPageSingleTap={onSwipeStart}
          onError={(error) => {
            console.error("❌ PDF rendering error:", error);
            setError("Could not render PDF. It may be corrupted.");
          }}
          onPressLink={(uri) => {
           
            // Handle PDF links if needed
          }}
        />
      ) : (
        // Keep layout stable but do not mount PDF when inactive
        <View style={styles.pdf} />
      )}

      {/* Page number overlay */}
      {totalPages > 0 && (
        <View style={[styles.pageNumberBox, { backgroundColor: Colors.cardBackground }]}>
          
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#000", 
    position: "relative" 
  },
  pdf: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_H,
    backgroundColor: "transparent",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: 20,
  },
  loadingText: { 
    marginTop: fh(10), 
    fontSize: ff(14),
    textAlign: 'center'
  },
  errorText: { 
    fontSize: ff(14), 
    fontWeight: "600",
    textAlign: 'center',
    marginBottom: fh(10)
  },
  retryText: {
    fontSize: ff(14),
    fontWeight: "600",
    textAlign: 'center',
    padding: 10,
  },
  pageNumberBox: {
    position: "absolute",
    bottom: fh(150),
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pageNumberText: {
    fontSize: ff(14),
    fontWeight: "600",
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  placeholderText: {
    fontSize: ff(12),
    fontWeight: "500",
  },
});

export default React.memo(PdfPagerViewer);