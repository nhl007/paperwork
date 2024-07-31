import "./styles.css";

/* eslint-disable react/prop-types */
import { useRef, useState } from "react";
import { FaAngleDown, FaImage } from "react-icons/fa";

import { AiOutlineUndo, AiOutlineRedo } from "react-icons/ai";
import { inputElements } from "./inputs";
import { createPortal } from "react-dom";
import { FiBold, FiItalic, FiUnderline } from "react-icons/fi";

// import PreviewTemplate from "./PreviewTemplate";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const TemplateBuilder = () => {
  const contentEditableRef = useRef(null);
  const [content, setContent] = useState("");
  const [selectionRange, setSelectionRange] = useState(null);

  const [showTextStyles, setShowTextStyles] = useState(false);
  const [currTextStyle, setCurrTextStyle] = useState("Normal");

  const [showInputOption, setShowInputOption] = useState(false);

  const [isResizing, setIsResizing] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);

  // const [preview, setPreview] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [customFields, setCustomFields] = useState([]);

  const [pdfUrl, setPdfUrl] = useState("");

  const [tagButtons, setTagButtons] = useState({
    b: false,
    i: false,
    u: false,
  });

  const [color, setColor] = useState("#666666");

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      setSelectionRange(selection.getRangeAt(0));
    }
  };

  const applyFormatting = (format) => {
    if (selectionRange) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(selectionRange);

      const tagMap = {
        normal: "formatBlock",
        h1: "formatBlock",
        h2: "formatBlock",
        h3: "formatBlock",
      };

      const command = tagMap[format];
      const value = format === "normal" ? "p" : format;

      if (command) {
        document.execCommand(command, false, value);
      }

      const newRange = document.createRange();
      newRange.setStartAfter(selectionRange.endContainer);
      newRange.collapse(true);

      selection.removeAllRanges();
      selection.addRange(newRange);

      contentEditableRef.current.normalize();
    }
  };

  const handleMouseDown = (e) => {
    if (e.target.tagName === "IMG") {
      setIsResizing(true);
      setCurrentImage(e.target);
    }
  };

  const handleMouseMove = (e) => {
    if (isResizing && currentImage) {
      const rect = currentImage.getBoundingClientRect();
      currentImage.style.width = `${e.clientX - rect.left}px`;
      currentImage.style.height = "auto";
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    setCurrentImage(null);
  };

  const setStyles = (command, value) => {
    document.execCommand(command, false, value);
    contentEditableRef.current.focus();
  };

  const setTheContent = () => {
    const html = contentEditableRef.current.innerHTML;
    setContent(html);
    checkFormatting();
  };

  const insertImage = (e) => {
    const fileData = e.target.files?.[0];
    const fileReader = new FileReader();
    if (fileData) {
      fileReader.readAsDataURL(fileData);
      fileReader.onloadend = async () => {
        const img = document.createElement("img");
        img.alt = "alt_img";
        img.style.width = "200px";
        img.style.display = "inline";
        img.style.marginRight = "10px";
        img.src = fileReader.result;

        img.addEventListener("click", (event) => {
          setIsResizing(true);
          setCurrentImage(event.target);
        });

        const div = document.createElement("div");
        div.appendChild(img);
        contentEditableRef.current.appendChild(div);
      };
    }
  };

  const insertInputAtCursor = (attrs) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    if (!contentEditableRef.current.contains(range.commonAncestorContainer))
      return;

    const input = document.createElement("input");
    input.type = "text";
    input.id = attrs.id;
    input.name = attrs.name;
    input.placeholder = attrs.placeHolder;

    range.deleteContents();
    range.insertNode(input);

    range.setStartAfter(input);
    range.setEndAfter(input);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const closest = (element, selector) => {
    if (!element) return { hasParent: false, element: null };

    if (element instanceof Element && element.matches(selector)) {
      return { hasParent: true, element: element };
    }

    return closest(element.parentNode, selector);
  };

  const checkFormatting = () => {
    const range = window.getSelection().getRangeAt(0);

    if (range) {
      const startContainer = range.startContainer;

      ["b", "i", "u", "font", "div", "pre", "img", "span"].forEach((tag) => {
        const { hasParent, element } = closest(startContainer, tag);
        setTagButtons((prev) => ({ ...prev, [tag]: hasParent }));
        if (tag === "font" && element) {
          const color = element.color;
          if (color) {
            setColor(() => color);
          } else {
            setColor(() => "#666666");
          }
        }

        if (!hasParent && tag === "font") {
          setColor(() => "#666666");
        }
      });
    } else {
      console.log("No range selected.");
    }
  };

  const handleGeneratePdf = async () => {
    const element = contentEditableRef.current;

    const clonedElement = element.cloneNode(true);

    const inputs = clonedElement.querySelectorAll("input");
    inputs.forEach((input) => {
      const span = document.createElement("span");
      span.textContent = " ";
      input.parentNode.replaceChild(span, input);
    });

    document.body.appendChild(clonedElement);

    // Generate the canvas
    const canvas = await html2canvas(clonedElement, {
      scale: 3, // Increase for better quality
      useCORS: true,
    });

    document.body.removeChild(clonedElement);

    // Create PDF from canvas
    const imgData = canvas.toDataURL("image/png", 1.0);
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const pdfBlob = pdf.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    setPdfUrl(pdfUrl);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="bg-[#f6f6f6] w-full h-full p-[22px]"
    >
      {pdfUrl && (
        <div className=" z-[999] bg-black/60 w-screen h-full flex justify-center items-center fixed top-0 left-0">
          <button
            onClick={() => setPdfUrl(null)}
            className=" absolute top-14 right-6 text-2xl py-2 bg-red-300 rounded-md text-red-900 px-3 flex justify-center items-center"
          >
            X
          </button>
          <iframe
            src={pdfUrl}
            title="PDF Preview"
            width="100%"
            height="600px"
          />
        </div>
      )}
      {showModal &&
        createPortal(
          <CustomFieldModal
            setCustomFields={setCustomFields}
            setModal={setShowModal}
          />,
          document.body
        )}
      {/* {preview && <PreviewTemplate html={content} showPreview={setPreview} />} */}
      {/* //? Top Toolbar */}
      <div className=" text-[rgb(102,102,102)] flex gap-6 items-center mb-3">
        <button
          title="Bold"
          className={`${tagButtons.b && "text-red-400"}`}
          onClick={() => {
            setTagButtons((prev) => ({ ...prev, b: true }));
            setStyles("bold");
          }}
        >
          <FiBold />
        </button>
        <button
          title="Underline"
          className={`${tagButtons.u && "text-red-400"}`}
          onClick={() => {
            setTagButtons((prev) => ({ ...prev, u: true }));
            setStyles("underline");
          }}
        >
          <FiUnderline />
        </button>
        <button
          title="Italic"
          className={`${tagButtons.i && "text-red-400"}`}
          onClick={() => {
            setTagButtons((prev) => ({ ...prev, i: true }));
            setStyles("italic");
          }}
        >
          <FiItalic />
        </button>

        <div className="relative">
          <div
            onClick={() => setShowTextStyles((prev) => !prev)}
            className="cursor-pointer border-[1px] rounded-[8px] border-[#C2C6CE] rounded-b-md flex items-center justify-between w-[200px] p-2"
          >
            <p>{currTextStyle}</p>
            <FaAngleDown
              className={`transition-all duration-300   ${
                showTextStyles ? "rotate-180" : " rotate-0"
              }`}
            />
          </div>
          {showTextStyles && (
            <div className=" absolute z-[999] text-[#666666] px-3 pb-3 pt-1 -bottom-[140px] bg-white w-full left-0 h-[140px] ">
              <p
                className="text__heading__1 cursor-pointer"
                onClick={() => {
                  setShowTextStyles(false);
                  applyFormatting("h1");
                  setCurrTextStyle("Heading 1");
                }}
              >
                Heading 1
              </p>
              <p
                className="text__heading__2 cursor-pointer"
                onClick={() => {
                  setShowTextStyles(false);
                  applyFormatting("h2");
                  setCurrTextStyle("Heading 2");
                }}
              >
                Heading 2
              </p>
              <p
                className="text__heading__3 cursor-pointer"
                onClick={() => {
                  setShowTextStyles(false);
                  applyFormatting("h3");
                  setCurrTextStyle("Heading 3");
                }}
              >
                Heading 3
              </p>
              <p
                className="cursor-pointer"
                onClick={() => {
                  setShowTextStyles(false);
                  applyFormatting("normal");
                  setCurrTextStyle("Normal");
                }}
              >
                Normal
              </p>
            </div>
          )}
        </div>

        <input
          title="Text Color"
          value={color}
          onChange={(e) => {
            setColor(e.target.value);
            setStyles("foreColor", `${e.target.value}`);
          }}
          type="color"
          name="color"
        />

        <label htmlFor="editor__image" title="Insert Image">
          <FaImage />
        </label>
        <input
          className=" hidden"
          id="editor__image"
          type="file"
          accept="image/x-png,image/gif,image/jpeg"
          onChange={insertImage}
          onClick={(e) => {
            const element = e.target;
            element.value = "";
          }}
        />
        <button onClick={() => setStyles("undo")}>
          <AiOutlineUndo />
        </button>
        <button onClick={() => setStyles("redo")}>
          <AiOutlineRedo />
        </button>
      </div>
      <div className=" relative h-full flex gap-10">
        {/* //? Editor */}

        <div className="text__editor__con flex-1 w-full flex">
          <div
            className="text__editor max-w-full focus:outline-none break-words"
            ref={contentEditableRef}
            contentEditable
            // onChange={setTheContent}
            onMouseUp={saveSelection}
            onKeyUp={saveSelection}
            onInput={setTheContent}
            onClick={() => {
              handleMouseDown();
              checkFormatting();
            }}
          ></div>
        </div>
        {/* //? Right Toolbar */}
        <div className="flex flex-col gap-6 bg-[#f6f6f6]">
          <div className="relative">
            <div
              onClick={() => setShowInputOption((prev) => !prev)}
              className=" cursor-pointer border-[1px] rounded-[8px] text-[#666666] border-[#C2C6CE]  flex items-center justify-between w-[270px] p-3"
            >
              <p>Select</p>
              <FaAngleDown
                className={`transition-all duration-300 ${
                  showInputOption ? "rotate-180" : " rotate-0"
                }`}
              />
            </div>
            {showInputOption && (
              <div className=" flex items-center flex-col gap-1 w-full overflow-y-scroll max-h-[220px] h-[220px] absolute text-[#666666] pb-3 pt-1 -bottom-[220px] bg-white left-0  ">
                {inputElements.map((elem) => {
                  return (
                    <button
                      className=" min-w-full py-3 hover:bg-slate-200 shadow-sm font-medium text-sm"
                      key={elem.id}
                      onClick={() =>
                        insertInputAtCursor({ ...elem, id: elem.id })
                      }
                    >
                      {elem.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex w-full flex-col gap-3 mt-auto">
            {customFields.length
              ? customFields.map((elem) => {
                  return (
                    <button
                      className=" py-2 bg-[#f6f6f6] shadow-lg rounded-lg font-medium"
                      key={elem.id}
                      onClick={() =>
                        insertInputAtCursor({
                          ...elem,
                          id: elem.name.split(" ").join("_"),
                        })
                      }
                    >
                      {elem.name}
                    </button>
                  );
                })
              : null}
          </div>
          <div className="flex gap-4">
            <button
              // onClick={() => setPreview(true)}
              onClick={handleGeneratePdf}
              className=" py-2 flex-1 bg-[#f6f6f6] shadow-lg rounded-lg font-medium"
            >
              Preview
            </button>
          </div>
          <button
            className=" mb-8 py-2 text-white  bg-[#6D9C54] shadow-lg rounded-lg font-medium"
            onClick={() => setShowModal(true)}
          >
            Create Custom Field
          </button>
        </div>
      </div>
    </div>
  );
};

const CustomFieldModal = ({ setModal, setCustomFields }) => {
  const [data, setData] = useState({
    name: "",
    type: "text",
    required: false,
    placeHolder: "",
    instructions: "",
    employee: true,
  });
  const onSubmit = (e) => {
    e.preventDefault();
    setCustomFields((prev) => [...prev, data]);
    setModal(false);
  };
  return (
    <div className="fixed text-[#666666] top-0 left-0 w-full bg-black/20 h-screen flex justify-center items-center">
      <form
        onSubmit={onSubmit}
        className=" flex bg-white rounded-lg flex-col gap-6 p-6 w-[400px]"
      >
        <h1 className=" text-3xl font-semibold">Add Custom Field</h1>
        <div className="flex flex-col gap-2">
          <label>Name</label>
          <input
            className=" bg-slate-100 px-3 py-2 rounded-md"
            onChange={(e) =>
              setData((prev) => ({ ...prev, name: e.target.value }))
            }
            value={data.name}
            placeholder="Enter Field Name"
            name="name"
            required
          />
        </div>
        <div className=" flex gap-6 items-center">
          <div className="flex items-center gap-4">
            <label htmlFor="radio_customField_not_required">Not Required</label>
            <input
              onChange={() => setData((prev) => ({ ...prev, required: false }))}
              id="radio_customField_not_required"
              type="radio"
              checked={!data.required}
              value="not-required"
            />
          </div>
          <div className="flex items-center gap-4">
            <label htmlFor="radio_customField_required">Required</label>
            <input
              onChange={() => setData((prev) => ({ ...prev, required: true }))}
              id="radio_customField_required"
              type="radio"
              checked={data.required}
              value="required"
            />
          </div>
        </div>
        <div>
          <p className=" -mb-[5]">Responsible Party:</p>

          <div className=" flex gap-6 items-center">
            <div className="flex items-center gap-4">
              <label htmlFor="radio_customField_not_employee">Employer</label>
              <input
                onChange={() =>
                  setData((prev) => ({ ...prev, employee: false }))
                }
                id="radio_customField_not_employee"
                type="radio"
                checked={!data.employee}
                value="not-employee"
              />
            </div>
            <div className="flex items-center gap-4">
              <label htmlFor="radio_customField_employee">Employee</label>
              <input
                onChange={() =>
                  setData((prev) => ({ ...prev, employee: true }))
                }
                id="radio_customField_employee"
                type="radio"
                checked={data.employee}
                value="employee"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label>Place Holder</label>
          <input
            className=" bg-slate-100 px-3 py-2 rounded-md"
            value={data.placeHolder}
            onChange={(e) =>
              setData((prev) => ({ ...prev, placeHolder: e.target.value }))
            }
            placeholder="Enter Placeholder Text"
            name="name"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label>Instruction</label>
          <input
            className=" bg-slate-100 px-3 py-2 rounded-md"
            onChange={(e) =>
              setData((prev) => ({ ...prev, instructions: e.target.value }))
            }
            value={data.instructions}
            placeholder="Enter Further Instruction"
            name="instruction"
          />
        </div>
        <button
          type="submit"
          className="bg-[#6D9C54] text-white py-2 rounded-lg font-semibold"
        >
          Add Field
        </button>
        <button className=" ml-auto mt-4" onClick={() => setModal(false)}>
          Cancel
        </button>
      </form>
    </div>
  );
};

export default TemplateBuilder;
