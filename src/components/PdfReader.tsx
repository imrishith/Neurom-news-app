import React, { useState } from "react";
import { Dimensions, View, Text, StyleSheet } from "react-native";
import PagerView from "react-native-pager-view";
import Pdf from "react-native-pdf";

interface Props {
  pdfUrl: string;
  verticalPagerRef: React.RefObject<any>;
}

const { width, height } = Dimensions.get("window");

const PdfReader: React.FC<Props> = ({ pdfUrl }) => {
  const [numPages, setNumPages] = useState<number>(1);

  const source = { uri: pdfUrl, cache: true };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PDF Document</Text>

      <PagerView
        style={styles.pager}
        orientation="horizontal"
        initialPage={0}
        offscreenPageLimit={1}
      >
        {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
          <View key={page} style={styles.page}>
            <Pdf
              source={source}
              page={page}
              style={styles.pdf}
              onLoadComplete={(totalPages: number) => {
                if (numPages !== totalPages) setNumPages(totalPages);
              }}
              onError={(error: any) =>
                console.error("PDF load error:", error)
              }
            />
          </View>
        ))}
      </PagerView>

      <Text style={styles.hintText}>⬅️ Swipe left/right for PDF pages</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111", alignItems: "center" },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFD700",
    marginVertical: 10,
  },
  pager: { flex: 1, width, height: height * 0.8 },
  page: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  pdf: { width, height: "100%" },
  hintText: { color: "#FFD700", marginVertical: 10, fontSize: 14 },
});

export default PdfReader;
