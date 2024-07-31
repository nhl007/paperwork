/* eslint-disable react/prop-types */
import { Document, Page, PDFViewer, StyleSheet } from "@react-pdf/renderer";
import Html from "react-pdf-html";

const PreviewTemplate = ({ html, showPreview }) => {
  function replaceWhitespaceWithNbsp(htmlContent) {
    let tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    function processNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        node.nodeValue = node.nodeValue.replace(/ /g, "\u00A0");
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        for (let i = 0; i < node.childNodes.length; i++) {
          processNode(node.childNodes[i]);
        }
      }
    }

    processNode(tempDiv);

    return tempDiv.innerHTML;
  }

  const formattedHtml = replaceWhitespaceWithNbsp(html);

  const styles = StyleSheet.create({
    body: {
      padding: 10,
    },
  });

  const stylesheet = {
    div: {
      display: "inline",
    },
  };

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
          <Page style={styles.body}>
            <Html stylesheet={stylesheet} collapse={false}>
              {formattedHtml}
            </Html>
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
