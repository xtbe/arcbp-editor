/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // Idempotent: skip if the collection already exists
  try {
    app.findCollectionByNameOrId("blueprints")
    return
  } catch (_) {}

  const collection = new Collection({
    name: "blueprints",
    type: "base",
    // Open rules — this is an internal management tool, not a public API
    listRule:   "",
    viewRule:   "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      { name: "name",            type: "text", required: true  },
      { name: "workshop",        type: "text", required: false },
      { name: "image",           type: "text", required: false },
      { name: "crafting_recipe", type: "json", required: false },
      { name: "available",       type: "bool", required: false },
      { name: "loot",            type: "bool", required: false },
      { name: "harvester_event", type: "bool", required: false },
      { name: "quest_reward",    type: "bool", required: false },
      { name: "trials_reward",   type: "bool", required: false },
    ],
  })

  app.save(collection)
}, (app) => {
  // Down: remove the collection if rolling back
  try {
    const collection = app.findCollectionByNameOrId("blueprints")
    app.delete(collection)
  } catch (_) {}
})
