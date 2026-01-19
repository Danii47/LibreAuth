import { Eye, EyeOff } from "lucide-react-native";
import { Text, TouchableOpacity, View, TextInput, StyleSheet } from "react-native";

export const CustomInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  fieldKey,
  keyboardType = "default",
  autoCapitalize = "none",
  colors,
  focusedInput,
  setFocusedInput,
  activeColor,
  isPassword = false,
  isPasswordVisible = false,
  onTogglePasswordVisibility
}: any) => (
  <View style={styles.inputGroup}>
    <Text style={[styles.label, { color: colors.subtext }]}>{label}</Text>
    <View style={{ justifyContent: "center" }}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.modalBg,
            color: colors.text,
            borderColor: focusedInput === fieldKey ? activeColor : colors.border,
            borderWidth: 2,
            paddingRight: isPassword ? 50 : 15
          }
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtext}
        onFocus={() => setFocusedInput(fieldKey)}
        onBlur={() => setFocusedInput(null)}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={isPassword && !isPasswordVisible}
      />
      {isPassword && (
        <TouchableOpacity
          onPress={onTogglePasswordVisibility}
          style={styles.eyeIcon}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isPasswordVisible ? (
            <EyeOff size={20} color={colors.subtext} />
          ) : (
            <Eye size={20} color={colors.subtext} />
          )}
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, marginBottom: 8, fontWeight: "600", marginLeft: 2 },
  input: {
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    height: "100%",
    justifyContent: "center"
  },
})