import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { SessionContext } from "./../session";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  table: {
    minWidth: 200,
  },
});

class ReportsGeneratedByDate extends React.Component {
  static contextType = SessionContext;

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      data: []
    };
  }

  getUsers = () => {
    this.setState({
      loading: true,
    });
    fetch(process.env.API_URL + '/reportsGeneratedByDate', {
      credentials: "same-origin"
    })
    .then(response => response.json())
    .then(data => {
      if (!data.isLoggedIn) {
        this.context.handleLoginStatusChange(false);
        return;
      } else if (data.messages[0] == 'You do not have permissions to do this') {
        window.location.href = process.env.API_URL + '/notPermitted';
      } else {
        this.setState({
          loading: false,
          data: data.data,
        })
      }
    });
  }

  componentDidMount() {
    this.getUsers();
  }

  render() {
    const classes = this.props.classes;
    const data = this.state.data

    return (
      <div>
        <Typography variant="h5">
          Reports Generated by Date
        </Typography>
        <Typography>
          This will be a graph one day when I have time
        </Typography>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell numeric>Reports</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map(row => {
              return (
                <TableRow hover key={row.created}>
                  <TableCell component="th">
                    {row.created}
                  </TableCell>
                  <TableCell numeric>{row.generated}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }
}

ReportsGeneratedByDate.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ReportsGeneratedByDate);
