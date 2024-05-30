//@ts-nocheck
import { useState } from "react";
import { createToast } from "../components/Toast";
import link from "../views/links.json";
import { corsHeaders } from "../components/corsHeaders";

export function useDashActions() {
  const [tempFTC, setTempFTC] = useState([]);
  const [tempCases, setTempCases] = useState([]);
  const [addLoading, setAddLoading] = useState(false);
  const [remLoading, setRemLoading] = useState(false);

  const handleAddToFeatured = (id, title, id2) => {
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
          setAddLoading(false);
          //Data1 is the response from the first request and handles the updating of featured test cases

          setTempFTC(updatedFTC);
          setTempCases(updatedCases);
          //Data2 is the response from the second request and handles the get request for the test case reference from TestRail

          const refs = data2.json.refs;
          let updatedRefs = "";

          //should prevent duplicates in the test case reference field
          if (!refs) {
            updatedRefs = id2;
          } else {
            let refsArray = refs.split(", ");
            if (!refsArray.includes(id2)) {
              updatedRefs = refs + ", " + id2;
            } else {
              updatedRefs = refs;
            }
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
          createToast(`${id2} has been referenced in Test Case ${id}`, true);
        })
        .catch((error) => {
          setAddLoading(false);
          createToast(`Failed to reference ${id2} to Test Case ${id2}`, false);
        });
    }
  };

  const handleRemoveFromFeatured = (id, title, id2) => {
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
          setRemLoading(false);
          //data1 is the response from the first request and handles the updating of featured test cases

          setTempFTC(updatedFTC);
          setTempCases([]);

          //data2 is the response from the second request and handles the get request for the test case reference from TestRail

          const refs = data2.json.refs;
          let removeCurrentID = refs.split(", ");

          removeCurrentID = removeCurrentID.filter((ref) => ref !== id2);

          let updatedRefs = removeCurrentID.join(", ");

          `Updated references field: ${updatedRefs}`;
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
          createToast(
            `${id2} has been taken off the reference field from Test Case: ${id}`,
            true
          );
        })
        .catch((error) => {
          setRemLoading(false);
          console.error("Error adding test case to featured:", error);
          createToast(
            `${id2} has been taken off the reference field from Test Case: ${id}`,
            false,
            4000
          );
        });
    }
  };

  const clearRefField = (id, title, id2) => {
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

          setTempFTC(updatedFTC);
          setTempCases([]);

          //data2 is the response from the second request and handles the get request for the test case reference from TestRail

          const refs = data2.json.refs;
          if (!refs) {
            return;
          }

          let removeCurrentID = refs.split(", ");

          removeCurrentID = removeCurrentID.filter((ref) => ref !== id2);

          let updatedRefs = removeCurrentID.join(", ");

          return fetch(`${link.TESTRAIL_UPDATE_CASE}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refs: updatedRefs, id: `${id}` }),
          });

          //adds the feature ID to the test case reference field and sends a fetch request to update the test case reference field
        })
        .then((response) => response.json())
        .then((data) => {
          setRemLoading(false);
        })
        .catch((error) => {
          setRemLoading(false);
        });
    }
  };

  return {
    tempFTC,
    setTempFTC,
    tempCases,
    setTempCases,
    addLoading,
    setAddLoading,
    remLoading,
    setRemLoading,
    handleAddToFeatured,
    handleRemoveFromFeatured,
    clearRefField,
  };
}
