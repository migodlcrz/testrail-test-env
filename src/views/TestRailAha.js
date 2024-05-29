//@ts-nocheck
import React, { useState, useEffect } from "react";
import TestRailDash from "./TestRailDash";
import { useAhaActions } from "../actions/AhaActions";
import { TestAhaStyles } from "../styles/TestAhaStyles";

const TestRailAha = ({ settings, id }) => {
  const {
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
  } = useAhaActions();

  getProjInit(id);
  getIdInit(suiteAndSec);
  featureSetter(id);

  return (
    <>
      <h1> TestRail Integration TESTING ENVIRONMENT </h1>
      {testCaseList === null && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <>
            <select
              onChange={() => {
                setSuitAndSec(!suiteAndSec);
              }}
              ref={projectIdRef}
              disabled={loading}
              style={TestAhaStyles.select_style}
            >
              <option value="0">Project Name</option>
              {projects &&
                projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.id} - {project.name}
                  </option>
                ))}
            </select>
            <div style={TestAhaStyles.select_style_with_center}>
              <select
                onChange={() => {
                  setSuitAndSec(!suiteAndSec);
                }}
                ref={sectionIdRef}
                disabled={!hasSuiteId || loading}
                style={TestAhaStyles.select_style}
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
                style={TestAhaStyles.input_style}
              />
              {loading && <div style={TestAhaStyles.loading_style} />}
            </div>

            <div style={TestAhaStyles.select_style_with_center}>
              <button
                onClick={() => handleSubmit(id)}
                disabled={!completeForm || loading}
                style={TestAhaStyles.submit_button}
              >
                Submit
              </button>
              {loadSubmit && <div style={TestAhaStyles.load_submit_spinner} />}
              <div className="text-xl">{errorMessage}</div>
            </div>
          </>
        </div>
      )}

      {testCaseList !== null && (
        <div style={TestAhaStyles.tcl_div}>
          {testCaseList.json.cases.length > 0 && (
            <button style={TestAhaStyles.Add_TestCase_Button}>
              <a
                href={`https://trajector.testrail.io/index.php?/cases/add/${testCaseList.json.cases[0].suite_id}`}
                target="_blank"
                style={{ color: "white" }}
              >
                Add Test Case
              </a>
            </button>
          )}
          <button
            onClick={() => handleDelete(id, testCaseList.json.cases)}
            style={TestAhaStyles.Clear_Button}
          >
            Clear
          </button>
        </div>
      )}

      {testCaseList !== null && (
        <TestRailDash
          id2={id}
          featuredTestCases={featureTestCases}
          settings={settings}
          testCaseList={testCaseList.json}
        />
      )}
    </>
  );
};

export default TestRailAha;

aha.on("testrail-cases", (props) => {
  return (
    <TestRailAha settings={props.settings} id={props.record.referenceNum} />
  );
});
