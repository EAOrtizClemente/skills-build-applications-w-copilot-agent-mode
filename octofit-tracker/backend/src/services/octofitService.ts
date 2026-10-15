import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  const error = new Error(message) as Error & { status: number };
  error.status = 400;
  return error;
}

function notFound(message: string) {
  const error = new Error(message) as Error & { status: number };
  error.status = 404;
  return error;
}

function normalizeObjectId(value: unknown, field: string) {
  if (!value || typeof value !== 'string' || !mongoose.isValidObjectId(value)) {
    throw badRequest(`Invalid ${field}`);
  }
  return new mongoose.Types.ObjectId(value);
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw badRequest('Activity payload is required');
  }

  const body = input as Record<string, unknown>;
  const userId = body.userId ?? body.user;
  const teamId = body.teamId ?? body.team;
  const type = typeof body.type === 'string' ? body.type.trim() : '';
  const minutes = Number(body.minutes);

  if (!type || !Number.isFinite(minutes) || minutes <= 0) {
    throw badRequest('Activity type and minutes are required');
  }

  const normalizedUserId = normalizeObjectId(userId, 'userId');
  const normalizedTeamId = normalizeObjectId(teamId, 'teamId');

  const user = await User.findById(normalizedUserId).lean();
  const team = await Team.findById(normalizedTeamId).lean();

  if (!user || !team) {
    throw badRequest('Activity references must resolve to an existing user and team');
  }

  const activity = await Activity.create({
    user: normalizedUserId,
    team: normalizedTeamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw badRequest('Team payload is required');
  }

  const body = input as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const mascot = typeof body.mascot === 'string' ? body.mascot.trim() : '';

  if (!name) {
    throw badRequest('Team name is required');
  }
  if (!mascot) {
    throw badRequest('Team mascot is required');
  }

  const members = Array.isArray(body.members) ? body.members : [];
  const normalizedMembers = members.map((member) => {
    if (typeof member === 'string' && mongoose.isValidObjectId(member)) {
      return new mongoose.Types.ObjectId(member);
    }
    if (member && typeof member === 'object' && 'toString' in member) {
      return new mongoose.Types.ObjectId(String(member));
    }
    throw badRequest('Team members must be valid user IDs');
  });

  const team = await Team.create({ name, mascot, members: normalizedMembers });
  return team.toObject();
}

export async function getLeaderboard() {
  const rows = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);

  return rows.map((row, index) => ({
    teamName: row.teamName,
    totalPoints: row.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = typeof userEmail === 'string' ? userEmail.trim() : '';
  if (!normalizedEmail) {
    throw badRequest('User email is required');
  }

  const user = await User.findOne({ email: normalizedEmail }).lean();
  if (!user) {
    throw notFound('User not found');
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const recentType = recentActivities[0]?.type ?? user.fitnessGoal ?? 'endurance';
  const focusCandidates = [user.fitnessGoal, recentType].filter(Boolean);

  const matchedWorkouts = await Workout.find({
    focus: { $in: focusCandidates },
  }).lean();

  const fallbackWorkouts = await Workout.find().limit(10).lean();
  const suggestions = (matchedWorkouts.length ? matchedWorkouts : fallbackWorkouts)
    .map((workout) => ({
      ...workout,
      reason: `Matches your ${user.fitnessGoal ?? 'goal'} and recent ${recentType} activity.`,
    }))
    .sort((left, right) => {
      const leftScore = focusCandidates.includes(left.focus) ? 1 : 0;
      const rightScore = focusCandidates.includes(right.focus) ? 1 : 0;
      return rightScore - leftScore;
    });

  if (!suggestions.length) {
    throw notFound('No workout suggestions found');
  }

  return suggestions;
}

export { User };
