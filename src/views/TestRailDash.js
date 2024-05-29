//@ts-nocheck
import { useEffect } from "react";
import React, { useState } from "react";
import { useDashActions } from "../actions/DashActions";
import { TestDashStyles } from "../styles/TestDashStyles";
import { TestAhaStyles } from "../styles/TestAhaStyles";
import { useEffectToast } from "../components/Toast";
import { useAhaActions } from "../actions/AhaActions";

const TestRailDash = ({ id, id2, featuredTestCases, testCaseList, error }) => {
  const {
    tempFTC,
    setTempFTC,
    addLoading,
    remLoading,
    handleAddToFeatured,
    handleRemoveFromFeatured,
  } = useDashActions();
  const { handleDelete } = useAhaActions();

  const [sectionName, setSectionName] = useState();
  const [featureTestCases, setFeatureTestCases] = useState([{}]);

  // for the suite and section data
  const [loading, setLoading] = useState(false);
  const [suiteAndSecData, setSuitAndSecData] = useState();
  const [suiteAndSec, setSuitAndSec] = useState(false);

  // for section ID
  const [projectIdField, setProjectIdField] = useState();
  const [projectIdNumber, setProjectIdNumber] = useState();

  // Gets the Project Number
  useEffect(() => {
    // If projectIdNumber is not 0, return early and don't run the rest of the effect
    if (
      projectIdNumber !== undefined &&
      projectIdNumber > 0 &&
      projectIdField
    ) {
      return;
    }

    fetch(`https://trajector1.aha.io/api/v1/features/${id2}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data) {
          return <div className="loading">No Available Projects.</div>;
        }
        const customFields = data.feature.custom_fields;

        // Gets the associated test case for the feature
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
        }
      });
  }, [projectIdNumber, projectIdField]);

  let featuredTC;
  const cases = testCaseList.cases;

  try {
    featuredTC = JSON.parse(featuredTestCases.value);
  } catch {
    featuredTC = [];
  }

  if (testCaseList === null || error) {
    return <div className="loading">No available Test Cases...</div>;
  }

  if (!cases || !testCaseList || !featuredTC || !id2 || !cases.length) {
    return <div className="loading">Invalid Request Submitted. Try Again </div>;
  }

  // gets the name of the section
  useEffect(() => {
    setLoading(true);
    const p_id2 = projectIdNumber;
    if (p_id2 > 0) {
      try {
        fetch(
          `https://aha-testrail-integration.srilan-catalinio.workers.dev/api/getID`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ project_id: p_id2 }),
          }
        )
          .then((response) => response.json())
          .then((data) => {
            setSuitAndSecData(data);
            setSuitAndSec(!suiteAndSec);
          });
      } catch (error) {
        console.error("Error fetching data from server:", error);
      }
    }
  }, [projectIdNumber]);

  //sets the section name everytime the suiteAndSecData is updated
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
    } else {
    }
  }, [projectIdNumber, suiteAndSec]);

  useEffect(() => {
    setTempFTC(featuredTC);

    return () => {
      setTempFTC([]);
    };
  }, []);

  useEffectToast();
  return (
    <div className="test-case-details">
      {" "}
      <div style={TestDashStyles.parent_div}>
        {loading ? (
          <div style={TestDashStyles.loading_div} />
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
      <div style={TestDashStyles.divider}></div>
      <div className="latest-test-runs" style={TestDashStyles.latest_test_runs}>
        <h2 style={TestDashStyles.h2_div_1}>
          <div style={TestDashStyles.header_div_2}>
            {remLoading && <div style={TestDashStyles.remLoading_style} />}
          </div>
          <strong style={TestDashStyles.strong_text_header_with_margin}>
            Feature Test Cases:
          </strong>
        </h2>

        {tempFTC && tempFTC.length > 0 ? (
          <ul style={{ marginTop: "1rem" }}>
            {tempFTC.map((case_l) => (
              <li key={case_l.id} style={TestDashStyles.tempFTC_Map_li}>
                <div style={TestDashStyles.tempFTC_Map_div}>
                  <button
                    disabled={remLoading || addLoading || loading}
                    onClick={() =>
                      handleRemoveFromFeatured(case_l.id, case_l.title, id2)
                    }
                    style={TestDashStyles.tempFTC_Map_button}
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
      <div className="latest-test-runs" style={TestDashStyles.tempFTC_div_2}>
        <h2 style={TestDashStyles.tempFTC_h2_2}>
          <div style={TestDashStyles.tempFTC_div_3}>
            {addLoading && <div style={TestDashStyles.addLoading} />}
          </div>
          <strong style={TestDashStyles.strong_text_header_with_margin}>
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
                    <li key={case_l.id} style={TestDashStyles.tempFTC_Map_li}>
                      <li key={case_l.id} style={TestDashStyles.tempFTC_Map_li}>
                        <div style={TestDashStyles.tempFTC_Map_div}>
                          <button
                            disabled={addLoading || remLoading}
                            onClick={() =>
                              handleAddToFeatured(case_l.id, case_l.title, id2)
                            }
                            style={TestDashStyles.tempFTC_Map_button}
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
      <div id="toast-container"></div>
    </div>
  );
};

export default TestRailDash;
