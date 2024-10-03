'use client'

import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';

import { ReactNode, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

import RawData from './2020-06-18-sps-demographic-data.json'

const AllData = RawData.rows.map(
  (row, id) => {
    const out = { id };
    RawData.header.forEach((header,header_idx) => {
      if (header === 'All Students') {
        out[header] = parseInt(row[header_idx]);
      } else if (header.startsWith('%')) {
        out[header] = parseFloat(row[header_idx])/100;

      } else {
        out[header] = row[header_idx];
      }
    });
    return out;
  });


const AllRegionTypes = ["Closure", "Director District"];
const DirectorDistricts = ["1","2","3","4","5","6","7"];
const DirectorNames = [
  "Liza Rankin",
  "Sarah Clark",
  "Evan Briggs",
  "Joe Mizrahi",
  "Michelle Sarju",
  "Gina Topp",
  "Brandon K. Hersey"];

const AllRegions = ["NW", "NE", "Central", "SW", "SE"];
const AllCategory = [
  "Female",
  "Gender X",
  "Male",
  "American Indian_ Alaskan Native",
  "Asian",
  "Black_ African American",
  "Hispanic_ Latino of any race_s_",
  "Native Hawaiian_ Other Pacific Islander",
  "Two or More Races",
  "White",
  "English Language Learners",
  "Foster Care",
  "Highly Capable",
  "Homeless",
  "Low-Income",
  "Migrant",
  "Military Parent",
  "Mobile",
  "Section 504",
  "Students with Disabilities",
];

const AllChangeType = [
  "Close A,B",
  "Close A",
  "Close B",
  "Move",
  "Program A",
  "Program A,B",
];

function getColor(entry, changeType) {
  if (typeof(changeType) === 'string') {
    if (entry['Change'] === changeType) {
      return "#ca0020";
    }
  } else if (Array.isArray(changeType)) {
    if (changeType.findIndex(x => x == entry['Change']) !== -1) {
      return "#ca0020";
    }
  }

  return "#0571b0";
}

function getData(region, regionType) {
  const data = new Array<any>;
  if (regionType === "Closure") {
    let regionsToGet = [region];
    if (region === 'All') {
      regionsToGet = AllRegions;
    }
    if (region === 'North') {
      regionsToGet = ['NW', 'NE'];
    }
    if (region === 'South') {
      regionsToGet = ['SW', 'SE'];
    }

    for (const r of regionsToGet) {
      data.push(...AllData.filter(x => x["Closure Region"] === r));
    }
  } else {
    data.push(...AllData.filter(x => x["District"] == region));
  }
  return data;
}

function OneGraph({data, category, changeType, title, ylabel}) {
  const column_name = `% ${category}`;

  data.sort((x,y) => {
    if (x[column_name] < y[column_name]) {
      return -1;
    } else if (x[column_name] > y[column_name]) {
      return 1;
    }
    return 0;
  });

  const options = {
    title: { text: title },
    xAxis: {
      title: { text: category },
      categories: data.map(x => x['SchoolName']),
    },
    yAxis: {
      title: { text: ylabel },
      plotLines: [{
        color: 'black', // Color value
        value: 0, // Value of where the line will appear
        width: 3 // Width of the line
      }],
    },
    plotOptions: {
      series: {
        stacking: 'normal'
      }
    },
    series: [{
      name: "% of students in school",
      type: "column",
      dataSorting: {
        enable: true,
      },
      data: data.map((entry, idx) => {
        return {
          x: idx,
          y: entry[column_name] * 100,
          name: entry[`# ${category}`],
          color: getColor(entry, changeType),
          dataLabels: {
            enabled: true,
            format: entry[`# ${category}`],
            verticalAlign: 'top',
          }
        }
      }),
    }],
  };
  return (
    <HighchartsReact
      containerProps={{ style: { height: "100%" } }}
      highcharts={Highcharts}
      options={options}
    />
  );
}

function makeRegionOptions(regionType) {
  const options = new Array<ReactNode>;

  if (regionType == 'Closure') {
    options.push(...['All', 'North', 'South'].map( r => (<option key={r} value={r}>{r}</option>)));
    options.push(...AllRegions.map( r => (<option key={r} value={r}>{r}</option>)));
  } else {
    options.push(...DirectorDistricts.map( r => (<option key={r} value={r}>{DirectorNames[parseInt(r)-1]}</option>)));
  }

  return options;
}

export default function Home() {
  const [regionType, setRegionType] = useState<string>("Closure");
  const [region, setRegion] = useState<string>("All");
  const [category, setCategory] = useState<string>("American Indian_ Alaskan Native");
  const [changeType, setChangeType] = useState<Array<string>>(AllChangeType);

  const data = getData(region, regionType);
  const columns: GridColDef<(typeof data)[number]>[] = 
    RawData.header.map(
      name => {
        const def : any = {
          field: name,
          headerName: name,
        };

        if (name === 'SchoolName') {
          def.width = 300;
        }

        if (name.startsWith('%')) {
          def.valueFormatter = (value) => {
            if (!value) {
              return value;
            }
            // Convert the decimal value to a percentage
            return (value * 100).toPrecision(3) + '%';
          };
        }

        return def;
      }) as GridColDef<(typeof data)[number]>[];
  const regionOptions = makeRegionOptions(regionType);

  return (
    <Stack style={{padding: "1px"}} spacing={2}>
      <Card>
        <Stack style={{padding: "1px"}} spacing={2} direction="row">
            <label>
              RegionType: 
              <select 
                  onChange={(e) => setRegionType(e.target.value)}
                  className="m-2 border-black border-2"
                  value={regionType}>
                {
                  AllRegionTypes.map( r => (<option key={r} value={r}>{r}</option>))
                }
              </select>
            </label>
            <label>
              Region: 
              <select 
                  onChange={(e) => setRegion(e.target.value)}
                  className="m-2 border-black border-2"
                  value={region}>
                {regionOptions}
              </select>
            </label>
            <label>
              Category: 

              <select 
                  onChange={(e) => setCategory(e.target.value)}
                  className="m-2 border-black border-2"
                  value={category}>
                {
                  AllCategory.map( r => (<option key={r} value={r}>{r}</option>))
                }
              </select>
            </label>
            <label>
              Change Type: 
              <select 
                  multiple
                  onChange={(e) => setChangeType(Array.from(e.target.selectedOptions, option => option.value))}
                  className="m-2 border-black border-2"
                  value={changeType}>
                {
                  AllChangeType.map( r => (<option key={r} value={r}>{r}</option>))
                }
              </select>
            </label>
        </Stack>

        <Box style={{height: "800px"}}>
          <OneGraph
            title={`% ${category} in School`}
            category={category}
            changeType={changeType}
            data={data}
            ylabel="%"
          />
        </Box>

        <DataGrid
          rows={data}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 100,
              },
            },
          }}
          pageSizeOptions={[100]}
          disableRowSelectionOnClick
        />
      </Card>
    </Stack>
  );
}
