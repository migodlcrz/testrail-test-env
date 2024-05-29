//@ts-nocheck
import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import TestRailDash from "./TestRailDash";
import link from "./links.json";
// import test from "node:test";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://trajector1.aha.io",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

const TestRailAha = ({ id, settings }) => {
  const projectIdRef = useRef("");
  const suiteIdRef = useRef("");
  const sectionIdRef = useRef("");

  const [_featureTestCases, setFeatureTestCases] = useState([{}]);
  const [hasSuiteId, setHasSuiteId] = useState(false);
  const [projects, setProjects] = useState();
  const [suiteAndSecData, setSuitAndSecData] = useState();
  const [suiteAndSec, setSuitAndSec] = useState(false);
  const [completeForm, setCompleteForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadSubmit, setLoadSubmit] = useState(false);

  const [id_pass, setId_pass] = useState(0);

  function checkForm() {
    if (
      (projectIdRef.current.value !== "0" ||
        projectIdRef.current.value !== null) &&
      (sectionIdRef.current.value !== "0" ||
        sectionIdRef.current.value !== null)
    ) {
      setCompleteForm(true);
    } else {
      setCompleteForm(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    const p_id = projectIdRef.current.value;

    if (p_id === "0") {
      setLoading(false);
      return checkForm();
    }
    if (p_id) {
      try {
        axios
          .post(
            `https://aha-endpoints-migration.srilan-catalinio.workers.dev/api/getID`,
            { project_id: p_id },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
          .then((data) => {
            if (data.data) {
              setHasSuiteId(true);
              setSuitAndSecData(data.data);
              checkForm();
            } else {
              return checkForm();
            }
            setLoading(false);
          });
      } catch (error) {
        console.error("Error fetching data from server:", error);
      }
    }
  }, [suiteAndSec]);

  useEffect(() => {
    setLoading(true);
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
        setId_pass(data.data.Projects.value);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    axios
      .get(`https://trajector1.aha.io/api/v1/features/${id}`, {
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

        if (
          projectIdField &&
          suiteIdField &&
          sectionIdField &&
          featuredTestCasesField
        ) {
          handleSubmit(
            projectIdField.value,
            suiteIdField.value,
            sectionIdField.value,
            featuredTestCasesField.value
          );
        } else {
          console.error("Error: Required custom fields not found");
        }
      });
  }, [id]);

  const handleSubmit = async (id1, id2, id3, id4) => {
    setLoadSubmit(true);
    const projectId = Number(projectIdRef.current.value) || Number(id1);
    const suiteId = Number(suiteIdRef.current.value) || Number(id2);
    const sectionId = Number(sectionIdRef.current.value) || Number(id3);
    let associatedtestcases = [{}];

    try {
      if (id4 != null || id4 != [{}] || id4 != undefined) {
        associatedtestcases = JSON.parse(id4);
      } else {
        associatedtestcases = "";
      }
    } catch (error) {
      //console.error("Error parsing associated test cases:", error);
      associatedtestcases = "";
    }

    if (projectId && suiteId && sectionId) {
      try {
        const response = await axios.post(
          //TESTRAIL TESTCASE DATA ENDPOINT
          `${link.TESTRAIL_TESTCASE_LIST}`,
          { projectId, suiteId, sectionId, associatedtestcases },
          { headers: { "Content-Type": "application/json" } }
        );

        setTestCaseList(response.data);
        updateTestRailResponse(
          projectId,
          suiteId,
          sectionId,
          id,
          associatedtestcases
        );
        setLoadSubmit(false);
      } catch (error) {
        console.error("Error fetching data from server:", error);
        setLoadSubmit(false);
      }
    } else {
      setLoadSubmit(false);
    }
  };

  const ClearField = async (id) => {
    const projectId2 = 0;
    const suiteId2 = 0;
    const sectionId2 = 0;
    const id2 = id;
    const associated_test_cases = "";
    setFeatureTestCases([{}]);

    try {
      const response = await fetch(`${link.AHA_EDIT_CUSTOM_FIELD}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
          Authorization: `Bearer ${link.AHA_GET_FEATURE_APIKEY}`,
        },
        body: JSON.stringify({
          projectId2,
          suiteId2,
          sectionId2,
          id2,
          associated_test_cases,
        }),
      });
    } catch (error) {
      console.error("Error fetching data from server:", error);
    }
  };

  const updateTestRailResponse = async (
    projectId,
    suiteId,
    sectionId,
    id,
    assoc
  ) => {
    const projectId2 = projectId;
    const suiteId2 = suiteId;
    const sectionId2 = sectionId;
    const id2 = id;
    const associated_test_case = assoc;

    await axios.post(
      //EDIT CUSTOM FIELD ENDPOINT
      `${link.AHA_EDIT_CUSTOM_FIELD}`,
      { projectId2, suiteId2, sectionId2, id2, associated_test_case },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // try {
    //   const response = await fetch(`${link.AHA_EDIT_CUSTOM_FIELD}`, {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //       ...corsHeaders,
    //       "Authorization": `Bearer ${link.AHA_GET_FEATURE_APIKEY}`,
    //     },
    //     body: JSON.stringify({ projectId2, suiteId2, sectionId2, id2, associated_test_case })
    //   ,
    //   });

    //   if (!response.ok) {
    //     console.error("Error updating custom field:", response.statusText);
    //   }

    // } catch (error) {
    //   console.error("Error fetching data from server:", error);
    // }
  };

  const handleDelete = (id) => {
    setTestCaseList(null);
    setHasSuiteId(false);
    const projectId = projectIdRef.current.value;
    const suiteId = suiteIdRef.current.value;
    const sectionId = sectionIdRef.current.value;
    ClearField(id);
    // updateTestRailResponse(projectId, suiteId, sectionId, id);
  };
  const [testCaseList, setTestCaseList] = useState(null);

  return (
    <>
      {testCaseList === null && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <>
            <select
              onChange={() => {
                setSuitAndSec(!suiteAndSec);
              }}
              ref={projectIdRef}
              disabled={loading}
              style={{
                width: "90%",
                marginRight: "2.5%",
              }}
            >
              <option value="0">Project Name</option>
              {projects &&
                projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.id} - {project.name}
                  </option>
                ))}
            </select>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <select
                onChange={() => {
                  setSuitAndSec(!suiteAndSec);
                }}
                ref={sectionIdRef}
                disabled={!hasSuiteId || loading}
                style={{
                  width: "90%",
                  marginRight: "2.5%",
                }}
              >
                <option value="0">Section Number</option>
                {suiteAndSecData &&
                  suiteAndSecData.length > 0 &&
                  suiteAndSecData[0].suite_id &&
                  suiteAndSecData.map((item, index) => (
                    <option key={index} value={item.id}>
                      {item.id} - {item.name}
                    </option>
                  ))}
              </select>

              <input
                ref={suiteIdRef}
                type="number"
                readOnly
                placeholder="Suite Number"
                value={
                  suiteAndSecData != undefined
                    ? suiteAndSecData[0]
                      ? suiteAndSecData[0].suite_id
                      : 0
                    : 0
                }
                style={{
                  width: "25%",
                  marginRight: "2.5%",
                  paddingLeft: "10px",
                  display: "none",
                }}
              />
              {loading && (
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    border: "4px solid rgba(0, 0, 0, 0.1)",
                    borderLeftColor: "#7986CB",
                    animation: "spin 1s linear infinite",
                  }}
                />
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => handleSubmit(id)}
                disabled={!completeForm || loading}
                style={{
                  width: "18.5%",
                  backgroundColor: "rgb(0, 115, 207)",
                  border: "none",
                  borderWidth: "1px",
                  color: "white",
                  borderRadius: ".3rem",
                  boxSizing: "border-box",
                  cursor: "pointer",
                  display: "inline-block",
                  fontSize: ".8125rem",
                  lineHeight: "1.25rem",
                  minWidth: "2rem",
                  outline: "none!important",
                  padding: "4px 12px",
                  textAlign: "center",
                  textDecoration: "none",
                  textShadow: "none",
                  WebkitUserSelect: "none",
                  userSelect: "none",
                  verticalAlign: "middle",
                  marginTop: "10px",
                  marginBottom: "10px",
                  marginRight: "10px",
                }}
              >
                Submit
              </button>
              {loadSubmit && (
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    border: "4px solid rgba(0, 0, 0, 0.1)",
                    borderLeftColor: "#7986CB",
                    animation: "spin 1s linear infinite",
                  }}
                />
              )}
            </div>
          </>
        </div>
      )}

      {
        testCaseList !== null && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 3,
              marginTop: "10px",
              justifyContent: "flex-end",
            }}
          >
            {
              <button
                style={{
                  backgroundColor: "rgb(0,115,207)",
                  borderWidth: "1px",
                  color: "black",
                  border: "1px solid black",
                  borderRadius: ".3rem",
                  boxSizing: "border-box",
                  cursor: "pointer",
                  display: "inline-block",
                  fontSize: ".8125rem",
                  lineHeight: "1.25rem",
                  minWidth: "2rem",
                  outline: "none!important",
                  padding: "2px 12px",
                  textAlign: "center",
                  textDecoration: "none",
                  textShadow: "none",
                  WebkitUserSelect: "none",
                  userSelect: "none",
                  position: "relative",
                  top: "-1.px",
                }}
              >
                <a
                  href={`https://trajector.testrail.io/index.php?/cases/add/${testCaseList.testCaseList.cases[0].suite_id}`}
                  target="_blank"
                  style={{ color: "white" }}
                >
                  Add Test Case
                </a>
              </button>
            }
            <button
              onClick={() => handleDelete(id)}
              style={{
                width: "10%",
                backgroundColor: "white",
                border: "1px solid black ",
                borderWidth: "1px",
                color: "black",
                borderRadius: ".3rem",
                boxSizing: "border-box",
                cursor: "pointer",
                display: "inline-block",
                fontSize: ".8125rem",
                lineHeight: "1.25rem",
                outline: "none!important",
                padding: "2px 12px",
                textAlign: "center",
                textDecoration: "none",
                textShadow: "none",
                WebkitUserSelect: "none",
                userSelect: "none",
                position: "relative",
                minWidth: "58px",
                maxWidth: "58px",
              }}
            >
              Clear
            </button>
          </div>
        )
        // )
      }

      {testCaseList !== null && (
        <TestRailDash
          id2={id}
          featuredTestCases={_featureTestCases}
          settings={settings}
          testCaseList={testCaseList.testCaseList}
        />
      )}
    </>
  );
};

aha.on("testrail-cases", (props) => {
  return (
    <TestRailAha settings={props.settings} id={props.record.referenceNum} />
  );
});

export default TestRailAha;
