import { gql } from "graphql_tag";

export const typeDefs = gql`
  scalar Date

  type User {
    id: ID!
    username: String!
    email: String!
    name: String!
    surname: String!
    token: String
  }

  type Player {
    id: ID!
    name: String!
    team: Team
    UpdateBy: ID!
  }
  type Team {
    id: ID!
    name: String!
    matches: [Match!]!
    players: [Player!]!
    goals_for: Int!
    goals_against: Int!
    classified: Boolean!
    UpdateBy: ID!
  }

  enum MatchStatus {
    PENDING
    FINISHED
    PLAYING
  }

  type Match {
    id: ID!
    team1: Team!
    team2: Team!
    goals_team1: Int!
    goals_team2: Int!
    date: String!
    status: MatchStatus!
    UpdateBy: ID!
  }


  type Query {
    Me(token: String!): User!
    test: String!
    teams(classified: Boolean): [Team!]!
    team(id: ID!): Team!
    matches(status: MatchStatus, team: ID, date: Date): [Match!]!
    match(id: ID!): Match!
    players(team_id: ID): [Player!]!
    player(id: ID!): Player!
  }

  type Mutation {
    register(
      username: String!
      email: String!
      password: String!
      name: String!
      surname: String!
      clave: String!
    ): User!
    login(username: String!, password: String!): String!
    createTeam(name: String!, players: [ID!]!, classified: Boolean!, token:String!): Team!
    updateTeam(id: ID!, players: [ID!], classified: Boolean, token: String!): Team!
    deleteTeam(id: ID!): Team!
    createMatch(
      team1: ID!
      team2: ID!
      goals_team1: Int!
      goals_team2: Int!
      date: String!
      status: MatchStatus!
    ): Match!
    updateMatch(
      id: ID!
      goals_team1: Int!
      goals_team2: Int!
      status: MatchStatus!
    ): Match!
    deleteMatch(id: ID!): Match!
    createPlayer(name: String!, token: String!): Player!
    deletePlayer(id: ID!): Player!
  }
`;
