//@ts-nocheck
import link from "../views/links.json";
import { useRef, useState, useEffect } from "react";
import { corsHeaders } from "../components/corsHeaders";
import { useDashActions } from "../actions/DashActions";
import { createToast } from "../components/Toast";

export const useAhaActions = () => {
  const projectIdRef = useRef("");
  const suiteIdRef = useRef("");
  const sectionIdRef = useRef("");

  const [featureTestCases, setFeatureTestCases] = useState([{}]);
  const [hasSuiteId, setHasSuiteId] = useState(false);
  const [completeForm, setCompleteForm] = useState(false);
  const [loadSubmit, setLoadSubmit] = useState(false);
  const [testCaseList, setTestCaseList] = useState(null);

  //   These states are used in the useEffect Functions. Main purpose is to set the data to be used
  //  for getting the projects, suites and section id's.
  const [projects, setProjects] = useState();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [suiteAndSec, setSuitAndSec] = useState(false);
  const [suiteAndSecData, setSuitAndSecData] = useState();
  const [testRailId, setTestRailId] = useState("");

  const { clearRefField } = useDashActions();

  const checkForm = () => {
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
  };

  const handleSubmit = async (id, id1, id2, id3, id4) => {
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
      associatedtestcases = "";
    }

    if (projectId && suiteId && sectionId) {
      try {
        const response = await fetch(`${link.TESTRAIL_TESTCASE_LIST}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId,
            suiteId,
            sectionId,
            associatedtestcases,
          }),
        });

        const data = await response.json();

        if (data) setTestCaseList(data);

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

  //removes the Aha Ticket ID from the TESTRAIL reference field when Clearing.
  const delTestRailField = async (id, testCaseList) => {
    testCaseList.forEach((testCase) => {
      try {
        clearRefField(testCase.id, testCase.title, id);
      } catch (error) {}
    });
  };

  const handleDelete = async (id, testCaseList) => {
    delTestRailField(id, testCaseList);
    clearField(id);
    //These were being used in previous versions of the code.

    // const projectId = projectIdRef.current.value;
    // const suiteId = suiteIdRef.current.value;
    // const sectionId = sectionIdRef.current.value;
  };

  const clearField = async (id) => {
    setTestCaseList(null);
    setHasSuiteId(false);
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

    await fetch(`${link.AHA_EDIT_CUSTOM_FIELD}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId2,
        suiteId2,
        sectionId2,
        id2,
        associated_test_case,
      }),
    });
  };

  const getIdInit = (suiteAndSec) => {
    useEffect(() => {
      setLoading(true);
      const p_id = projectIdRef.current.value;

      if (p_id === "0") {
        setLoading(false);
        return checkForm();
      }
      if (p_id) {
        try {
          fetch(
            `https://aha-testrail-integration.srilan-catalinio.workers.dev/api/getID`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ project_id: p_id }),
            }
          )
            .then((response) => response.json())
            .then((data) => {
              if (data) {
                setErrorMessage("");
                setHasSuiteId(true);
                setSuitAndSecData(data);
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
  };

  const getProjInit = (id) => {
    useEffect(() => {
      setLoading(true);
      fetch(
        "https://aha-testrail-integration.srilan-catalinio.workers.dev/api/getProj",
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.length === 0 || data.Projects.length === 0) {
            return <div> No Projects are being received right now.</div>;
          } else {
            setProjects(data.Projects);
            setLoading(false);
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }, [id]);
  };

  const featureSetter = (id) => {
    useEffect(() => {
      fetch(`https://trajector1.aha.io/api/v1/features/${id}`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          const customFields = data.feature.custom_fields;

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
              id,
              projectIdField.value,
              suiteIdField.value,
              sectionIdField.value,
              featuredTestCasesField.value
            );
          } else {
            console.error("Error: Required custom fields not found");
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }, [id]);
  };

  return {
    featureTestCases,
    handleSubmit,
    handleDelete,
    projectIdRef,
    suiteIdRef,
    sectionIdRef,
    testCaseList,
    hasSuiteId,
    completeForm,
    loadSubmit,
    getProjInit,
    getIdInit,
    featureSetter,
    projects,
    suiteAndSecData,
    suiteAndSec,
    loading,
    errorMessage,
    setSuitAndSec,
  };
};
