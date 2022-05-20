import React from 'react';
import Highcharts from 'highcharts'
import HighchartsExporting from 'highcharts/modules/exporting'
import HighchartsReact from 'highcharts-react-official'

if (typeof Highcharts === 'object') {
    HighchartsExporting(Highcharts)
}

class Histogram extends React.Component {
  constructor(props) {
    super(props);

    this.getChartOptions = this.getChartOptions.bind(this);
  }


  getChartOptions() {
    return {
      title: { text: this.props.title },
      xAxis: {
        title: { text: this.props.data.xlabel },
        categories: this.props.data.categories
      },
      yAxis: {
        title: { text: this.props.data.ylabel },
        max: this.props.data.ymax
      },
      series: this.props.data.series.map(d => Object.assign({ type: "column" }, d)),
    };
  }

  render() {
    return (
      <figure className="p-2 m-1 flex flex-col w-full bg-gray-100 histogram">
          <HighchartsReact
            highcharts={Highcharts}
            options={this.getChartOptions()}
          />
      </figure>
    );
  }
}

export default Histogram;
