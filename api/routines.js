const express = require("express");
const router = express.Router();
const {
  getAllPublicRoutines,
  createRoutine,
  updateRoutine,
  getRoutineById,
  destroyRoutine,
  addActivityToRoutine,
  getRoutineActivitiesByRoutine,
} = require("../db");
const { requireUser, requiredNotSent } = require("./utils");

// GET /api/routines
router.get("/", async (req, res, next) => {
  try {
    const routines = await getAllPublicRoutines();
    res.send(routines);
  } catch (error) {
    next(error);
  }
});

// POST /api/routines
router.post(
  "/",
  requireUser,
  requiredNotSent({ requiredParams: ["name", "goal"] }),
  async (req, res, next) => {
    try {
      const { name, goal } = req.body;
      const createdRoutine = await createRoutine({
        creatorId: req.user.id,
        name,
        goal,
        isPublic: req.body.isPublic,
      });

      if (createdRoutine) {
        res.send(createdRoutine);
      } else {
        next({ name: "FailedToCreate", message: "Error creating routine" });
      }
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/routines/:routineId
router.patch(
  "/:routineId",
  requireUser,
  requiredNotSent({
    requiredParams: ["name", "goal", "isPublic"],
    atLeastOne: true,
  }),
  async (req, res, next) => {
    try {
      const { name, goal, isPublic } = req.body;
      const { routineId } = req.params;
      const routineToUpdate = await getRoutineById(routineId);

      if (!routineToUpdate) {
        next({ name: "NotFound", message: `No routine with ID ${routineId}` });
      } else if (req.user.id !== routineToUpdate.creatorId) {
        res.status(403);
        next({
          name: "WrongUserError",
          message: "You must be the creator to perform this action",
        });
      } else {
        const updatedRoutine = await updateRoutine({
          id: routineId,
          name,
          goal,
          isPublic,
        });

        if (updatedRoutine) {
          res.send(updatedRoutine);
        } else {
          next({ name: "FailedToUpdate", message: "Error updating routine" });
        }
      }
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/routines/:routineId
router.delete("/:routineId", requireUser, async (req, res, next) => {
  try {
    const { routineId } = req.params;
    const routineToUpdate = await getRoutineById(routineId);

    if (!routineToUpdate) {
      next({ name: "NotFound", message: `No routine with ID ${routineId}` });
    } else if (req.user.id !== routineToUpdate.creatorId) {
      res.status(403);
      next({
        name: "WrongUserError",
        message: "You must be the creator to perform this action",
      });
    } else {
      const deletedRoutine = await destroyRoutine(routineId);
      res.send({ success: true, ...deletedRoutine });
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/routines/:routineId/activities
router.post(
  "/:routineId/activities",
  requiredNotSent({ requiredParams: ["activityId", "count", "duration"] }),
  async (req, res, next) => {
    try {
      const { activityId, count, duration } = req.body;
      const { routineId } = req.params;

      const foundRoutineActivities = await getRoutineActivitiesByRoutine({
        id: routineId,
      });
      const existingRoutineActivities =
        foundRoutineActivities &&
        foundRoutineActivities.filter(
          (routineActivity) => routineActivity.activityId === activityId
        );

      if (existingRoutineActivities && existingRoutineActivities.length) {
        next({
          name: "RoutineActivityExistsError",
          message: `Routine activity already exists`,
        });
      } else {
        const createdRoutineActivity = await addActivityToRoutine({
          routineId,
          activityId,
          count,
          duration,
        });

        if (createdRoutineActivity) {
          res.send(createdRoutineActivity);
        } else {
          next({
            name: "FailedToCreate",
            message: "Error adding activity to routine",
          });
        }
      }
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
