// screens/CommentModal.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  StyleSheet,
  TextInput,
} from "react-native";
import Modal from "react-native-modal";
import Circle from "../components/Circle";
import { fw, fh, ff } from "../../utils/responsive";
import { useTheme } from "../context/ThemeContext";
import { commentService } from "../api/commentService/commentService";
import LoginModal from "./LoginModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useOnboarding } from "../context/OnboardingContext";

type CommentModalProps = {
  visible: boolean;
  onClose: () => void;
  contentId: number | string;
  contentType: "articles" | "videos" | "magazines" | "buzz";
};

type CommentItem = {
  comment_id: number;
  user_id?: number | null;
  device_id?: string | null;
  comment_text: string;
  created_at: string;
};

const Avatar = ({ username, avatar }: { username: string; avatar?: any }) => {
  const { Colors } = useTheme();
  const size = fw(29);

  if (avatar) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: Colors.mediumGray,
        }}
      >
        <Image
          source={avatar}
          style={{
            width: fw(12),
            height: fw(12),
            resizeMode: "contain",
            tintColor: Colors.lavenderPurple,
          }}
        />
      </View>
    );
  }

  return (
    <Circle
      size={size}
      backgroundColor={Colors.lavenderPurple}
      letter={username.charAt(0)}
      borderColor={Colors.mediumGray}
      borderWidth={1}
    />
  );
};

const CommentModal = ({ visible, onClose, contentId, contentType }: CommentModalProps) => {
  const { Colors } = useTheme();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loginVisible, setLoginVisible] = useState(false);

  // ✅ translations + fonts
  const { t, getFont } = useOnboarding();

  // ✅ Fetch comments when modal opens
  useEffect(() => {
    if (!visible || !contentId) return;

    (async () => {
      try {
        setLoading(true);
        const data = await commentService.getComments(contentType, contentId);
        setComments(data);
      } catch (err) {
        console.error("❌ Fetch comments failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, contentId, contentType]);

  // ✅ Function to check login manually when needed
  const checkLogin = async () => {
    const token = await AsyncStorage.getItem("accessToken");
    if (token) {
      setUser({ token });
      return true;
    } else {
      setUser(null);
      setLoginVisible(true);
      return false;
    }
  };

  // ✅ Post comment
  const postComment = async () => {
    if (!commentText.trim()) return;

    const isLoggedIn = await checkLogin();
    if (!isLoggedIn) return; // stop if not logged in

    try {
      const res = await commentService.addComment(contentType, contentId, commentText);

      setComments((prev) => [
        {
          comment_id: Date.now(),
          user_id: user?.user_id || null,
          device_id: user?.device_id || null,
          comment_text: commentText,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setCommentText("");
    } catch (err: any) {
      console.error("❌ Post comment failed:", err);

      // 🔹 If unauthorized, force login modal
      if (err?.response?.status === 401 || err?.status === 401) {
        setLoginVisible(true);
      }
    }
  };

  const renderComment = ({ item }: { item: CommentItem }) => (
    <View style={styles.commentRow}>
      <Avatar username={`U${item.user_id || "G"}`} />
      <View style={styles.commentContent}>
        <Text
          style={[
            styles.username,
            { color: Colors.lavenderPurple, fontFamily: getFont("regular") },
          ]}
        >
          {t("user")} {item.user_id || t("guest")}{" "}
          <Text style={[styles.time, { color: Colors.mediumGray }]}>
            · {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </Text>
        <Text
          style={[
            styles.commentText,
            { color: Colors.textcolor, fontFamily: getFont("regular") },
          ]}
        >
          {item.comment_text}
        </Text>
        <Text
          style={[
            styles.replyLink,
            { color: Colors.mediumGray, fontFamily: getFont("regular") },
          ]}
        >
          {t("reply")}
        </Text>
      </View>
      <View style={styles.likeColumn}>
        <Image
          source={require("../../assets/icons/heart.png")}
          style={[styles.heartIcon, { tintColor: Colors.textcolor }]}
        />
        <Text style={[styles.likesCount, { color: Colors.mediumGray }]}>0</Text>
      </View>
    </View>
  );

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      backdropOpacity={0.4}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
    >
      <View style={[styles.container, { backgroundColor: Colors.deepPurple }]}>
        {/* Drag Handle */}
        <View style={[styles.dragHandle, { backgroundColor: Colors.mediumGray }]} />

        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              { color: Colors.textcolor, fontFamily: getFont("semibold") },
            ]}
          >
            {t("comments")}
          </Text>
        </View>

        {/* Comments */}
        <FlatList
          data={comments}
          keyExtractor={(item) => item.comment_id.toString()}
          renderItem={renderComment}
          style={styles.commentList}
          contentContainerStyle={{ paddingBottom: fh(80) }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading ? (
              <Text
                style={{
                  color: Colors.mediumGray,
                  textAlign: "center",
                  marginTop: fh(20),
                  fontFamily: getFont("regular"),
                }}
              >
                {t("no_comments_yet")}
              </Text>
            ) : null
          }
        />

        {/* Footer */}
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.footer}>
            <View style={styles.commentInputRow}>
              <TextInput
                style={[
                  styles.textInput,
                  { color: Colors.textcolor, fontFamily: getFont("regular") },
                ]}
                placeholder={t("write_comment")}
                placeholderTextColor={Colors.mediumGray}
                value={commentText}
                onChangeText={setCommentText}
                onFocus={async () => {
                  const isLoggedIn = await checkLogin();
                  if (!isLoggedIn) return;
                }}
              />
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: Colors.lavenderPurple }]}
                onPress={postComment}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: ff(12),
                    fontFamily: getFont("semibold"),
                  }}
                >
                  {t("send")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* Login Modal */}
      <LoginModal
        visible={loginVisible}
        onClose={() => setLoginVisible(false)}
        onLoginSuccess={(u) => {
          setUser(u);
          setLoginVisible(false);
        }}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: { justifyContent: "flex-end", margin: 0 },
  container: {
    height: fh(500),
    borderTopLeftRadius: fw(20),
    borderTopRightRadius: fw(20),
    padding: fw(10),
  },
  dragHandle: {
    width: fw(40),
    height: fh(4),
    borderRadius: fw(2),
    alignSelf: "center",
    marginBottom: fh(8),
  },
  header: {
    paddingHorizontal: fw(16),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: ff(14), marginTop: fh(5) },
  commentList: { flex: 1, paddingHorizontal: fw(16) },
  commentRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: fh(12) },
  commentContent: { flex: 1, marginLeft: fw(10) },
  username: { fontSize: ff(12) },
  time: { fontSize: ff(12) },
  commentText: { fontSize: ff(12) },
  replyLink: { fontSize: ff(12), marginTop: fh(4) },
  likeColumn: { alignItems: "center", justifyContent: "flex-start", width: fw(35) },
  heartIcon: { width: fw(18), height: fw(18) },
  likesCount: { fontSize: ff(12) },
  footer: { paddingBottom: fh(20) },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: fw(12),
    marginBottom: fh(16),
    backgroundColor: "#222",
    borderRadius: fw(10),
    paddingHorizontal: fw(8),
  },
  textInput: { flex: 1, fontSize: ff(14), paddingVertical: fh(8), paddingHorizontal: fw(10) },
  sendButton: {
    paddingVertical: fh(6),
    paddingHorizontal: fw(12),
    borderRadius: fw(8),
    marginLeft: fw(6),
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CommentModal;
