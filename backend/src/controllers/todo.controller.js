import Todo from "../models/todo.model.js";

export const getTodos = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 100);

    const filter = {};
    if (req.query.status) filter.status = String(req.query.status);
    if (req.query.priority) filter.priority = String(req.query.priority);

    const [todos, total] = await Promise.all([
      Todo.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Todo.countDocuments(filter)
    ])

    res.status(200).json({
      data: todos,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch todos", error: error.message });
  }
};

export const getTodoById = async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.status(200).json(todo);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch todo", error: error.message });
  }
};

export const createTodo = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    const todo = await Todo.create({
      title,
      description,
      status,
      priority,
      dueDate,
    });

    res.status(201).json(todo);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const updateTodo = async (req, res) => {
  try {
    const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.status(200).json(todo);
  } catch (error) {
    res.status(400).json({ message: "Failed to update todo", error: error.message });
  }
};

export const deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.status(200).json({ message: "Todo deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete todo", error: error.message });
  }
};

