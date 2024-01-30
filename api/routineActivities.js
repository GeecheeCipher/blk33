const express = require('express');
const router = express.Router();
const { updateRoutineActivity, canEditRoutineActivity, destroyRoutineActivity, getRoutineActivityById, getAllActivities, getActivityById } = require('../db');
const client = require('../db/client');
const { requireUser, requiredNotSent } = require('./utils')

router.get("/", async (req, res, next) => {
  try {
    const activities = await getAllActivities();
    res.send(activities);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const activities = await getActivityById(req.params.id);
    res.send(activities);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/routine_activities/:routineActivityId
router.patch('/:routineActivityId', requireUser, requiredNotSent({requiredParams: ['count', 'duration'], atLeastOne: true}), async (req, res, next) => {
  try {
    const { count, duration } = req.body;
    const { routineActivityId } = req.params;

    if (!await canEditRoutineActivity(routineActivityId, req.user.id)) {
      res.status(403);
      return next({ name: "Unauthorized", message: "You cannot edit this routine_activity!" });
    }

    const updatedRoutineActivity = await updateRoutineActivity({ id: routineActivityId, count, duration });
    res.send(updatedRoutineActivity);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/routine_activities/:routineActivityId
router.delete('/:routineActivityId', requireUser, async (req, res, next) => {
  try {
    if (!await canEditRoutineActivity(req.params.routineActivityId, req.user.id)) {
      res.status(403);
      return next({ name: "Unauthorized", message: "You cannot edit this routine_activity!" });
    }

    const deletedRoutineActivity = await destroyRoutineActivity(req.params.routineActivityId);
    res.send({ success: true, ...deletedRoutineActivity });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
