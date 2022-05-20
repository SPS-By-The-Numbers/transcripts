import React from 'react';
import Highcharts from 'highcharts'

function DataControl({data, report_type, survey, stacked, subjects, onChange}) {
  if (!data) {
    return (<div>Loading Data</div>);
  }

  const makeOptions = (types) => {
    const options = [];
    [ "", ...types].forEach((type, idx) => options.push(
      <option key={idx} value={type}>{type}</option>
    ));
    return options;
  };

  // Setup report type Elements.
  const raw_report_types = Object.keys(data);
  const report_type_options = makeOptions(raw_report_types);

  // Setup survey Elements.
  const raw_surveys = data[report_type] ? Object.keys(data[report_type]) : [];
  const survey_options = makeOptions(raw_surveys);

  // Setup subject Elements.
  const raw_subjects = data[report_type] && data[report_type][survey] ? Object.keys(data[report_type][survey]) : [];
  const subject_options = makeOptions(raw_subjects);

  const subject_choices = [];
  subjects.forEach((subject, idx) => {
    const name = `choice-${idx}`;
    subject_choices.push(
      <span>
        <label htmlFor={name}>Series {idx+1}</label>
        <select key={name} name={name} data-type="subject" data-ordinal={idx} value={subject} onChange={onChange}>
            {subject_options}
        </select>
      </span>
    );
  });

  return (
    <section className="p-2 h-full w-full min-h-screen items-stretch justify-items-stretch bg-gray-300 space-x-1">
      <label htmlFor="report-type">Report Type:</label>
      <select name="report-type" value={report_type} data-type="report" onChange={onChange}>
          {report_type_options}
      </select>
      <label htmlFor="survey">Survey:</label>
      <select name="survey" value={survey} data-type="survey" onChange={onChange}>
          {survey_options}
      </select>
      <input type="checkbox" name="stacked" checked={stacked} data-type="stacked" onChange={onChange} />
      <label htmlFor="stacked">Stacked Display</label>
      <br />
      {subject_choices}
    </section>
  );
}

export default DataControl;
