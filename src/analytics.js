import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { SessionContext } from "./session";
import Grid from '@material-ui/core/Grid';
import MostDownloadedReports from './analytics/most_downloaded_reports';
import MostActiveUsersByDownloads from './analytics/most_active_users_by_downloads';
import Paper from '@material-ui/core/Paper';

const styles = theme => ({
  paper: {
    margin: theme.spacing.unit * 4,
    padding: theme.spacing.unit * 2
  },
});

class Analytics extends React.Component {
  static contextType = SessionContext;

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      data: []
    };
  }

  render() {
    const classes = this.props.classes;

    return (
      <Grid
        container
        direction="row"
        justify="center"
        alignItems="flex-start"
      >
        <Paper className={classes.paper}><MostDownloadedReports /></Paper>
        <Paper className={classes.paper}><MostActiveUsersByDownloads /></Paper>
      </Grid>
    );
  }
}

Analytics.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Analytics);
