import { StyleSheet } from "@react-pdf/renderer";
export const pdfBase = StyleSheet.create({
  pageDark:{ backgroundColor:"#0b0f14", color:"#eef2f6", paddingTop:54, paddingBottom:54, paddingLeft:44, paddingRight:44, fontFamily:"Helvetica" },
  pageLight:{ backgroundColor:"#ffffff", color:"#0b0f14", paddingTop:56, paddingBottom:56, paddingLeft:56, paddingRight:56, fontFamily:"Helvetica" },
  muted:{ color:"rgba(238,242,246,0.70)" },
  mutedLight:{ color:"rgba(11,15,20,0.66)" },
  header:{ fontSize:11, lineHeight:1.35, marginBottom:18 },
  technique:{ fontSize:24, lineHeight:1.15 },
  reason:{ fontSize:12, lineHeight:1.45, marginTop:8 },
  sectionTitle:{ fontSize:10, letterSpacing:1.2, marginTop:18, marginBottom:10, textTransform:"uppercase" },
  bullet:{ fontSize:12, lineHeight:1.45, marginBottom:6 },
  gear:{ fontSize:12, lineHeight:1.45 },
  divider:{ height:1, backgroundColor:"rgba(238,242,246,0.12)", marginTop:18, marginBottom:18 },
  dividerLight:{ height:1, backgroundColor:"rgba(11,15,20,0.10)", marginTop:18, marginBottom:18 },
  footer:{ fontSize:10, textAlign:"center", marginTop:26 },
});
