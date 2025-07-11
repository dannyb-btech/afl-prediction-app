"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Typography, Card, CardContent, Grid, CircularProgress, Alert, Button, Container, AppBar, Toolbar, FormControl, InputLabel, Select, MenuItem, Box } from "@mui/material";

export default function Home() {
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRound, setSelectedRound] = useState('upcoming');
  const [availableRounds, setAvailableRounds] = useState([]);

  useEffect(() => {
    fetch("/api/getTeamPredictions")
      .then(res => res.json())
      .then(data => {
        let arr = Array.isArray(data) ? data : [data];
        // Sort by matchDate (start time)
        arr = arr.sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate));
        setMatches(arr);
        
        // Extract unique rounds and sort them
        const rounds = [...new Set(arr.map(match => match.round))].sort((a, b) => a - b);
        setAvailableRounds(rounds);
        
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load matches");
        setLoading(false);
      });
  }, []);

  // Filter matches based on selected round
  useEffect(() => {
    if (selectedRound === 'upcoming') {
      // Show only matches that haven't started yet
      const now = new Date();
      const upcoming = matches.filter(match => new Date(match.matchDate) > now);
      setFilteredMatches(upcoming);
    } else if (selectedRound === 'all') {
      setFilteredMatches(matches);
    } else {
      // Filter by specific round
      const filtered = matches.filter(match => match.round === parseInt(selectedRound));
      setFilteredMatches(filtered);
    }
  }, [matches, selectedRound]);

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
        <Typography variant="h4" gutterBottom>AFL Matches</Typography>
        
        <Box sx={{ mb: 3, minWidth: 200 }}>
          <FormControl fullWidth>
            <InputLabel id="round-filter-label">Round Filter</InputLabel>
            <Select
              labelId="round-filter-label"
              id="round-filter"
              value={selectedRound}
              label="Round Filter"
              onChange={(e) => setSelectedRound(e.target.value)}
            >
              <MenuItem value="upcoming">Upcoming Matches</MenuItem>
              <MenuItem value="all">All Matches</MenuItem>
              {availableRounds.map(round => (
                <MenuItem key={round} value={round}>Round {round}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        <Grid container spacing={2}>
          {filteredMatches.map(match => (
            <Grid item xs={12} md={6} key={match.matchId}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {match.homeTeam} vs {match.awayTeam}
                  </Typography>
                  <Typography color="text.secondary">
                    {match.venue} — {match.matchDate}
                  </Typography>
                  {/* Team predictions details */}
                  {typeof match.homeWinProbability !== 'undefined' && typeof match.awayWinProbability !== 'undefined' && (
                    <Typography sx={{ mt: 1 }}>
                      {match.homeTeam} win probability: <b>{Math.round(match.homeWinProbability * 100)}%</b><br />
                      {match.awayTeam} win probability: <b>{Math.round(match.awayWinProbability * 100)}%</b>
                    </Typography>
                  )}
                  {typeof match.predictedWinner !== 'undefined' && (
                    <Typography>
                      Predicted winner: <b>{match.predictedWinner}</b>
                    </Typography>
                  )}
                  {/* Add total score and line predictions */}
                  {typeof match.predictedTotal !== 'undefined' && (
                    <Typography>
                      Predicted total score: <b>{Math.round(match.predictedTotal)}</b>
                    </Typography>
                  )}
                  {typeof match.predictedMargin !== 'undefined' && (
                    <Typography>
                      Predicted margin (line): <b>{Math.round(match.predictedMargin)}</b>
                    </Typography>
                  )}

                  <Button
                    component={Link}
                    href={`/match/${match.matchId}`}
                    variant="contained"
                    sx={{ mt: 2 }}
                  >
                    View Player Predictions
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
}