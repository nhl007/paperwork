/* eslint-disable react/prop-types */
import { Document, Page, PDFViewer, StyleSheet } from "@react-pdf/renderer";
import Html from "react-pdf-html";

const PreviewTemplate = ({ html, showPreview }) => {
  const styles = StyleSheet.create({
    page: {
      paddingHorizontal: "12px",
      paddingVertical: "48px",
      color: "#000000",
    },
  });

  console.log(html);

  const html2 = `<html>
  <body>
  <div>
      ${html}
  </div>
  </body>
</html>
`;

  return (
    <div className=" z-[999] bg-black/60 w-screen h-full flex justify-center items-center fixed top-0 left-0">
      <button
        onClick={() => showPreview(false)}
        className=" absolute top-14 right-6 text-2xl py-2 bg-red-300 rounded-md text-red-900 px-3 flex justify-center items-center"
      >
        X
      </button>
      <PDFViewer showToolbar width="100%" height="100%">
        <Document>
          <Page style={styles.page}>
            <Html>{html2}</Html>
          </Page>
        </Document>
      </PDFViewer>

      {/* <div
        className="text__editor w-full min-h-[500px] bg-white min-w-full"
        dangerouslySetInnerHTML={{
          __html: html,
        }}
      /> */}
    </div>
  );
};

export default PreviewTemplate;
