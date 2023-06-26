import { gql } from "graphql_tag";

export const typeDefs = gql`
  scalar Date
  scalar Any 

  type Team {
    id: ID!
    name: String!
    matches: [Match!]!
    players: [Player!]!
    goals_for: Int!
    goals_against: Int!
    classified: Boolean!
    updatedBy : ID!
  }

  
  type User {
    id: ID!
    username: String!
    email: String!
    name: String!
    surname: String!
    token: String
    updatedData : [Any!]!
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
    updatedBy : ID!
  }

  type Player {
    id: ID!
    name: String!
    team: Team
    updatedBy : ID!
  }

  type Query {

    Me(token: String!): User!
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
      surname: String!,
      clave : String!
    ): User!
    login(username: String!, password: String!): String!
    deleteUser(password: String!, token: String!) : User!

    createTeam(name: String!, players: [ID!]!, classified: Boolean!, token: String!): Team!
    updateTeam(id: ID!, players: [ID!], classified: Boolean,  token: String!): Team!
    deleteTeam(id: ID!,  token: String!): Team!

    createMatch(
      team1: ID!
      team2: ID!
      goals_team1: Int!
      goals_team2: Int!
      date: String!
      status: MatchStatus!
      token: String!
    ): Match!
    updateMatch(
      id: ID!
      goals_team1: Int!
      goals_team2: Int!
      status: MatchStatus!
      token: String!
    ): Match!
    deleteMatch(id: ID!, token: String!): Match!

    createPlayer(name: String, token: String!): Player!
    deletePlayer(id: ID!, token: String!): Player!
  }
`;
