"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Typography, Card, CardContent, Grid, CircularProgress, Alert, Button, Container, TextField, Box, FormControlLabel, Switch, FormGroup, FormControl, FormLabel, Checkbox, Accordion, AccordionSummary, AccordionDetails, AppBar, Toolbar } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function MatchDetails() {
  const { matchId } = useParams();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nameFilter, setNameFilter] = useState("");
  const [bettingThreshold, setBettingThreshold] = useState(75);
  const [hideNoBetting, setHideNoBetting] = useState(true);
  const [betTypes, setBetTypes] = useState([]);
  const [selectedBetTypes, setSelectedBetTypes] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);

  useEffect(() => {
    if (!matchId) return;
    fetch(`/api/getPlayerPredictions?matchId=${matchId}`)
      .then(res => res.json())
      .then(data => {
        setPlayers(Array.isArray(data) ? data : [data]);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load player predictions");
        setLoading(false);
      });
  }, [matchId]);

  // Get all unique bet types and teams from players
  useEffect(() => {
    if (!players || players.length === 0) return;
    const allTypes = new Set();
    const allTeams = new Set();
    players.forEach(player => {
      player.bettingOpportunities?.forEach(bet => {
        if (bet.market) allTypes.add(bet.market);
      });
      if (player.team) allTeams.add(player.team);
    });
    setBetTypes(Array.from(allTypes));
    setTeams(Array.from(allTeams));
  }, [players]);

  // Track which bet types are selected
  useEffect(() => {
    setSelectedBetTypes(betTypes);
  }, [betTypes]);

  // Track which teams are selected
  useEffect(() => {
    setSelectedTeams(teams);
  }, [teams]);

  const handleBetTypeChange = (type) => {
    setSelectedBetTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleTeamChange = (team) => {
    setSelectedTeams(prev =>
      prev.includes(team)
        ? prev.filter(t => t !== team)
        : [...prev, team]
    );
  };

  // Filtering logic
  const filteredPlayers = players.filter(player => {
    const nameMatch = player.player.toLowerCase().includes(nameFilter.toLowerCase());
    if (!nameMatch) return false;
    if (!selectedTeams.includes(player.team)) return false;
    if (hideNoBetting && (!player.bettingOpportunities || player.bettingOpportunities.length === 0)) return false;
    if (!player.bettingOpportunities || player.bettingOpportunities.length === 0) return true;
    // Only consider bets matching selected types
    const filteredBets = player.bettingOpportunities.filter(bet => selectedBetTypes.includes(bet.market));
    // Show if any filtered betting opportunity is >= threshold
    return filteredBets.some(bet => (bet.probability * 100) >= bettingThreshold);
  });

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AFL Predictions
          </Typography>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        <Button component={Link} href="/" sx={{ mb: 2 }}>&larr; Back to Matches</Button>
        <Typography variant="h4" gutterBottom>Player Predictions</Typography>
        {/* Filters section */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Filter by player name"
            value={nameFilter}
            onChange={e => setNameFilter(e.target.value)}
            size="small"
          />
          <TextField
            label="Min. Betting Opportunity (%)"
            type="number"
            value={bettingThreshold}
            onChange={e => setBettingThreshold(Number(e.target.value))}
            size="small"
            inputProps={{ min: 0, max: 100 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={hideNoBetting}
                onChange={e => setHideNoBetting(e.target.checked)}
                color="primary"
              />
            }
            label="Hide players with no betting opportunities"
          />
          {betTypes.length > 0 && (
            <FormControl component="fieldset" sx={{ minWidth: 200 }}>
              <FormLabel component="legend">Betting Types</FormLabel>
              <FormGroup row>
                {betTypes.map(type => (
                  <FormControlLabel
                    key={type}
                    control={
                      <Checkbox
                        checked={selectedBetTypes.includes(type)}
                        onChange={() => handleBetTypeChange(type)}
                      />
                    }
                    label={type}
                  />
                ))}
              </FormGroup>
              {teams.length > 0 && (
                <FormControl component="fieldset" sx={{ minWidth: 150, mt: 2 }}>
                  <FormLabel component="legend">Team</FormLabel>
                  <FormGroup row>
                    {teams.map(team => (
                      <FormControlLabel
                        key={team}
                        control={
                          <Checkbox
                            checked={selectedTeams.includes(team)}
                            onChange={() => handleTeamChange(team)}
                          />
                        }
                        label={team}
                      />
                    ))}
                  </FormGroup>
                </FormControl>
              )}
            </FormControl>
          )}
        </Box>
        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        <Grid container spacing={2}>
          {filteredPlayers.map(player => (
            <Grid item xs={12} md={6} key={player.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{player.player} ({player.team})</Typography>
                  <Typography color="text.secondary">vs {player.opposition} @ {player.venue}</Typography>
                  <Typography sx={{ mt: 1 }}>Predicted Disposals: {player.predictions?.disposals}</Typography>
                  <Typography>Predicted Goals: {player.predictions?.goals}</Typography>
                  <Typography>Predicted Supercoach: {player.predictions?.supercoach}</Typography>
                  {/* Betting opportunities */}
                  {player.bettingOpportunities && player.bettingOpportunities.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <Typography variant="subtitle2">Betting Opportunities:</Typography>
                      {player.bettingOpportunities.map((bet, idx) => (
                        <Typography key={idx} sx={{ ml: 2 }}>
                          {bet.market}: <b>{Math.round(bet.probability * 100)}%</b> ({bet.strength})
                        </Typography>
                      ))}
                    </div>
                  )}
                  {/* Expandable marketProbabilities */}
                  {player.marketProbabilities && Object.keys(player.marketProbabilities).length > 0 && (
                    <Accordion sx={{ mt: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Show all market probabilities</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {Object.entries(player.marketProbabilities).map(([market, prob], idx) => (
                          <Typography key={idx} sx={{ ml: 2 }}>
                            {market}: <b>{Math.round(prob * 100)}%</b>
                          </Typography>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
} 