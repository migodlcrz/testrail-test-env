//@ts-nocheck
import { useEffect } from "react";
import React, { useState } from "react";
import link from "./links.json";
import axios from "axios";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://trajector1.aha.io",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

const linkify = (text) => {
  if (!text) {
    return "";
  }

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(
    urlRegex,
    (url) => `<a href="${url}" target="_blank">${url}</a>`
  );
};

const TestRailDash = ({ id2, featuredTestCases, testCaseList, error }) => {
  const [tempFTC, setTempFTC] = useState([]);
  const [tempCases, setTempCases] = useState([]);
  const [addLoading, setAddLoading] = useState(false);
  const [remLoading, setRemLoading] = useState(false);
  const [sectionName, setSectionName] = useState();
  const [_featureTestCases, setFeatureTestCases] = useState([{}]);

  //for the suite and section data
  const [loading, setLoading] = useState(false);
  const [suiteAndSecData, setSuitAndSecData] = useState();
  const [suiteAndSec, setSuitAndSec] = useState(false);
  const [projects, setProjects] = useState([]);

  //for section ID
  const [projectIdField2, setProjectIdField] = useState();
  const [projectIdNumber, setProjectIdNumber] = useState();

  const [message, setMessage] = useState();
  let toastQueue = [];

  //project Id
  // const [projectName, setProjectName] = useState();

  //Gets the Project Number
  useEffect(() => {
    // If projectIdNumber is not 0, return early and don't run the rest of the effect
    if (
      projectIdNumber > 0 &&
      projectIdNumber !== undefined &&
      projectIdField2
    ) {
      // console.log("Project ID is bigger than  0 or undefined", projectIdNumber);
      return;
    }
    axios
      .get(`https://trajector1.aha.io/api/v1/features/${id2}`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((data) => {
        const customFields = data.data.feature.custom_fields;

        //Gets the associated test case for the feature
        const featuredTestCasesField = customFields.find(
          (field) => field.key === "associated_test_cases"
        );

        setFeatureTestCases(featuredTestCasesField);

        const projectIdField = customFields.find(
          (field) => field.key === "projectid"
        );
        const suiteIdField = customFields.find(
          (field) => field.key === "suiteid"
        );
        const sectionIdField = customFields.find(
          (field) => field.key === "section_id2"
        );

        if (sectionIdField && projectIdField && suiteIdField) {
          setProjectIdField(projectIdField);
          setProjectIdNumber(projectIdField.value);
          // setSuitAndSec(!suiteAndSec);
        }
      });
  }, [projectIdNumber, projectIdField2]); // Add projectIdNumber to the dependency array

  //gets the project name
  useEffect(() => {
    axios
      .get(
        "https://aha-endpoints-migration.srilan-catalinio.workers.dev/api/getProj",
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((data) => {
        setProjects(data.data.Projects);
        // for (let i = 0; i < data.data.Projects.length; i++) {
        //   if (data.data.Projects[i].id == projectIdNumber) {
        //     setProjectName(data.data.Projects[i].name);
        //   }
        // }
      });
  }, [projectIdNumber]);

  //gets the name of the section
  useEffect(() => {
    setLoading(true);
    const p_id2 = projectIdNumber;
    if (p_id2 > 0) {
      try {
        axios
          .post(
            `https://aha-endpoints-migration.srilan-catalinio.workers.dev/api/getID`,
            { project_id: p_id2 },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
          .then((data) => {
            setSuitAndSecData(data.data);
            setSuitAndSec(!suiteAndSec);
          });
      } catch (error) {
        console.error("Error fetching data from server:", error);
      }
    }
  }, [projectIdNumber]);

  let featuredTC;
  const cases = testCaseList.cases;

  if (testCaseList === null || error) {
    return <div className="loading">No available Test Cases...</div>;
  }
  try {
    featuredTC = JSON.parse(featuredTestCases.value);
  } catch {
    featuredTC = [];
  }

  if (!cases || !testCaseList || !featuredTC || !id2 || !cases[0].suite_id) {
    return <div className="loading">Try Again...</div>;
  }

  console.log(projectIdNumber);
  // console.log(projectName);
  console.log(sectionName);

  useEffect(() => {
    setTempFTC(featuredTC);

    return () => {
      setTempFTC([]);
    };
  }, []);

  useEffect(() => {
    const sectionId = cases[0].section_id;
    if (suiteAndSecData) {
      let filteredData = suiteAndSecData.filter(
        (item) => Number(item.id) === Number(sectionId)
      );

      filteredData.forEach((item) => {
        setSectionName(item.name);
      });
      setLoading(false);
    }
  }, [projectIdNumber, suiteAndSec]);

  const handleAddToFeatured = (id, title) => {
    setAddLoading(true);
    if (!tempFTC.some((caseItem) => caseItem.id === id)) {
      const updatedFTC = [...tempFTC, { id, title }];
      const featString = JSON.stringify(updatedFTC);

      const updatedCases = tempCases.filter((caseItem) => caseItem.id !== id);

      const request1 = fetch(`${link.AHA_EDIT_CUSTOM_FIELD}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
          Authorization: `Bearer ${link.AHA_GET_FEATURE_APIKEY}`,
        },
        body: JSON.stringify({ id2, associated_test_cases: featString }),
      });

      const request2 = fetch(`${link.TESTRAIL_GET_CASE}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: `${id}` }),
      });

      Promise.all([request1, request2])
        .then((responses) => {
          // Check if both requests were successful
          if (!responses[0].ok || !responses[1].ok) {
            throw new Error("Failed to add test case to featured");
          }
          return Promise.all(responses.map((response) => response.json()));
        })
        .then(([data1, data2]) => {
          //Data1 is the response from the first request and handles the updating of featured test cases
          console.log("Test case added to featured:", data1);
          setTempFTC(updatedFTC);
          setTempCases(updatedCases);
          //Data2 is the response from the second request and handles the get request for the test case reference from TestRail
          console.log(`References field for ${id}, ${data2.refs}`);
          const refs = data2.refs;
          let updatedRefs = "";

          if (!refs) {
            updatedRefs = id2;
            // console.log(`Updated references field: ${updatedRefs}`);
          } else {
            updatedRefs = data2.refs + ", " + id2;
            // console.log(`Updated references field: ${updatedRefs}`);
          }

          //adds the feature ID to the test case reference field and sends a fetch request to update the test case reference field
          return fetch(`${link.TESTRAIL_UPDATE_CASE}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refs: updatedRefs, id: `${id}` }),
          });
        })
        .then((response) => response.json())
        .then((data) => {
          setAddLoading(false);
          console.log("Second request data:", data);
          setMessage(`${id2} has been referenced in Test Case ${id}`);
        })
        .catch((error) => {
          setAddLoading(false);
          console.error("Error adding test case to featured:", error);
          setMessage(`Failed to reference ${id2} to Test Case ${id2}`);
        });
    }
  };

  const handleRemoveFromFeatured = (id, title) => {
    setRemLoading(true);
    if (!tempCases.some((caseItem) => caseItem.id === id)) {
      const updatedFTC = tempFTC.filter((caseItem) => caseItem.id !== id);
      const featString = JSON.stringify(updatedFTC);

      const request1 = fetch(`${link.AHA_EDIT_CUSTOM_FIELD}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
          Authorization: `Bearer ${link.AHA_GET_FEATURE_APIKEY}`,
        },
        body: JSON.stringify({ id2, associated_test_cases: featString }),
      });

      const request2 = fetch(`${link.TESTRAIL_GET_CASE}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: `${id}` }),
      });

      Promise.all([request1, request2])
        .then((responses) => {
          // Check if both requests were successful
          if (!responses[0].ok || !responses[1].ok) {
            throw new Error("Failed to add test case to featured");
          }
          return Promise.all(responses.map((response) => response.json()));
        })
        .then(([data1, data2]) => {
          //data1 is the response from the first request and handles the updating of featured test cases
          console.log("Test case added to featured:", data1);
          setTempFTC(updatedFTC);
          setTempCases([]);

          //data2 is the response from the second request and handles the get request for the test case reference from TestRail
          console.log("Second request data:", data2);
          const refs = data2.refs;
          let removeCurrentID = refs.split(", ");
          console.log(`References field for ${id}, ${removeCurrentID}`);
          removeCurrentID = removeCurrentID.filter((ref) => ref !== id2);
          console.log(`References field for ${id}, ${removeCurrentID}`);
          let updatedRefs = removeCurrentID.join(", ");

          console.log(`Updated references field: ${updatedRefs}`);
          //adds the feature ID to the test case reference field and sends a fetch request to update the test case reference field
          return fetch(`${link.TESTRAIL_UPDATE_CASE}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refs: updatedRefs, id: `${id}` }),
          });
        })
        .then((response) => response.json())
        .then((data) => {
          setRemLoading(false);
          console.log("Second request data:", data);
          setMessage(
            `${id2} has been taken off the reference field from Test Case: ${id}`
          );
        })
        .catch((error) => {
          setRemLoading(false);
          console.error("Error adding test case to featured:", error);
          s;
          setMessage(
            `${id2} has failed to be taken off the reference field in Test Case ID: ${id}`
          );
        });
    }
  };

  function createToast(message, duration = 4000) {
    // Check for duplicate message
    if (!toastQueue.includes(message)) {
      toastQueue.push(message); // Add message to the queue only if unique

      const displayToast = () => {
        const toastElement = document.createElement("div");
        toastElement.classList.add("toast");
        toastElement.style.width = "25%"; // Adjust the width here
        // toastElement.style.height = "9%"; // Adjust the width here
        toastElement.style.zIndex = "1000"; // Adjust the z-index here
        toastElement.style.fontSize = "1rem"; // Adjust the font size here
        toastElement.style.textAlign = "center";
        toastElement.style.margin = "20px";
        toastElement.style.padding = "1rem"; // Adjust the padding here
        toastElement.style.borderRadius = "10px"; // Adjust the border radius here
        toastElement.style.position = "absolute";
        toastElement.style.transition = "all 1s ease-in-out";
        toastElement.style.text = "bold";
        toastElement.style.bottom = "0";
        toastElement.style.backgroundColor = "#4FC978"; // Adjust the background color here
        // toastElement.style.color = "white"; // Adjust the text color here
        toastElement.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.1)"; // Adjust the box shadow here
        toastElement.style.border = "1px solid black"; // Adjust the border here
        toastElement.textContent = toastQueue.shift();

        const body = document.querySelector("body");
        body.appendChild(toastElement);

        setTimeout(() => {
          toastQueue = [];
          setMessage(""); // Clear message (if any
          toastElement.classList.add("hide");
          toastElement.addEventListener("transitionend", () => {
            toastElement.remove();
            if (toastQueue.length > 0) {
              createToast(); // Check for next message if queue is not empty
            }
          });
        }, duration);
      };

      // Optional delay to address potential async issues (similar to previous example)
      setTimeout(displayToast, 0);
    }
  }

  return (
    <div className="test-case-details">
      {" "}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {loading ? (
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              border: "4px solid rgba(0, 0, 0, 0.1)",
              borderLeftColor: "#7986CB",
              animation: "spin 1s linear infinite",
              zIndex: "10",
              marginBottom: "20px",
            }}
          />
        ) : (
          <h2>
            <strong
              style={{
                fontSize: "1.3rem",
              }}
            >
              Section:
              <strong> {cases[0].section_id} </strong>
              <strong>
                <a
                  href={`https://trajector.testrail.io/index.php?/suites/view/${cases[0].suite_id}&group_id=${cases[0].section_id}`}
                  target="_blank"
                >
                  {" "}
                  {sectionName}
                </a>
              </strong>
            </strong>
          </h2>
        )}
      </div>
      <div
        style={{
          display: "flex",
          width: "100%",
          borderTop: "1px solid black",
        }}
      ></div>
      <div
        className="latest-test-runs"
        style={{
          flex: "flex-row",
          marginTop: "10px",
          border: "1px solid #ECECEC ",
          padding: "10px 10px",
          borderRadius: "10px",
          backgroundColor: "#ECECEC",
        }}
      >
        <h2
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              marginRight: "10px",
            }}
          >
            {remLoading && (
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  border: "4px solid rgba(0, 0, 0, 0.1)",
                  borderLeftColor: "#7986CB",
                  animation: "spin 1s linear infinite",
                  zIndex: "10",
                }}
              />
            )}
          </div>
          <strong
            style={{
              fontSize: "1.3rem",
              marginLeft: "40px",
            }}
          >
            Feature Test Cases:
          </strong>
        </h2>

        {tempFTC && tempFTC.length > 0 ? (
          <ul style={{ marginTop: "1rem" }}>
            {tempFTC.map((case_l) => (
              <li
                key={case_l.id}
                style={{ listStyle: "none", marginBottom: ".5rem" }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "3rem",
                    marginLeft: "-1rem",
                  }}
                >
                  <button
                    disabled={remLoading || addLoading}
                    onClick={
                      () => handleRemoveFromFeatured(case_l.id, case_l.title)
                      // testrailrefs(case_l.id)
                    }
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      border: "1px solid black",
                      borderRadius: "30%",
                      maxHeight: "30px",
                      maxWidth: "30px",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="black"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 12h-5V6h-2v6H6l6 7z" />
                    </svg>
                  </button>
                  <p>
                    <strong>{case_l.id}</strong>
                  </p>
                  <a
                    href={`https://trajector.testrail.io/index.php?/cases/view/${case_l.id}`}
                    target="_blank"
                    style={{ flexWrap: "wrap" }}
                  >
                    <h4 style={{ color: "rgb(0, 115, 207)" }}>
                      {" "}
                      {case_l.title}
                    </h4>
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ marginLeft: "20px" }}>No Test Cases Selected </p>
        )}
      </div>
      <div
        className="latest-test-runs"
        style={{
          marginTop: "10px",
          border: "1px solid #ECECEC",
          padding: "10px",
          borderRadius: "10px",
          backgroundColor: "#ECECEC",
        }}
      >
        <h2
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              marginRight: "10px",
            }}
          >
            {addLoading && (
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  border: "4px solid rgba(0, 0, 0, 0.1)",
                  borderLeftColor: "#7986CB",
                  animation: "spin 1s linear infinite",
                  zIndex: "10",
                }}
              />
            )}
          </div>
          <strong
            style={{
              fontSize: "1.3rem",
              marginLeft: "40px",
            }}
          >
            Available Test Cases:
          </strong>
        </h2>

        {cases.length > 0 ? (
          <ul style={{ marginTop: "1rem" }}>
            {tempFTC.length === cases.length &&
            tempFTC.every((item) =>
              cases.find((caseItem) => caseItem.id === item.id)
            ) ? (
              <p>
                All available test cases have been associated with this feature.
              </p>
            ) : (
              cases
                .filter(
                  (case_l) =>
                    !tempFTC.some((case_ftc) => case_ftc.id === case_l.id)
                )
                .map((case_l) => (
                  <>
                    <li
                      key={case_l.id}
                      style={{ listStyle: "none", marginBottom: ".5rem" }}
                    >
                      <li
                        key={case_l.id}
                        style={{ listStyle: "none", marginBottom: ".5rem" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            gap: "3rem",
                            marginLeft: "-1rem",
                          }}
                        >
                          <button
                            disabled={addLoading || remLoading}
                            onClick={
                              () => handleAddToFeatured(case_l.id, case_l.title)

                              // console.log(case_l.id)
                            }
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              border: "1px solid black",
                              borderRadius: "30%",
                              maxHeight: "30px",
                              maxWidth: "30px",
                              backgroundColor: "transparent",
                              cursor: "pointer",
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="black"
                              stroke="currentColor"
                              strokeWidth="1"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M13 18v-6h5l-6-7-6 7h5v6z" />
                            </svg>
                          </button>

                          <p>
                            <strong>{case_l.id}</strong>
                          </p>

                          <a
                            href={`https://trajector.testrail.io/index.php?/cases/view/${case_l.id}`}
                            target="_blank"
                            style={{ flexWrap: "wrap" }}
                          >
                            <h4 style={{ color: "rgb(0, 115, 207)" }}>
                              {" "}
                              {case_l.title}
                            </h4>
                          </a>
                        </div>
                      </li>
                    </li>
                  </>
                ))
            )}
          </ul>
        ) : (
          <p>No Test List available</p>
        )}
      </div>
      <div id="toast-container">{message && createToast(message)}</div>
    </div>
  );
};

export default TestRailDash;
