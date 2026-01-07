import { Request, Response, Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { filter, category, priority, search, sortBy, order } = req.query;
    
    const where: any = {};
    
    if (filter === 'completed') {
      where.done = true;
    } else if (filter === 'active') {
      where.done = false;
    }
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (priority && priority !== 'all') {
      where.priority = priority;
    }
    
    if (search && typeof search === 'string') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const orderBy: any = {};
    if (sortBy === 'priority') {
      orderBy.priority = order === 'asc' ? 'asc' : 'desc';
    } else if (sortBy === 'dueDate') {
      orderBy.dueDate = order === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }
    
    const todos = await prisma.todo.findMany({
      where,
      orderBy
    });
    
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const total = await prisma.todo.count();
    const completed = await prisma.todo.count({ where: { done: true } });
    const active = await prisma.todo.count({ where: { done: false } });
    
    const byPriority = await prisma.todo.groupBy({
      by: ['priority'],
      _count: true
    });
    
    const overdue = await prisma.todo.count({
      where: {
        done: false,
        dueDate: {
          lt: new Date()
        }
      }
    });
    
    res.json({
      total,
      completed,
      active,
      overdue,
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = item._count;
        return acc;
      }, {} as any)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, priority, category, dueDate } = req.body;
    
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const data: any = { title };
    
    if (description) data.description = description;
    if (priority) data.priority = priority;
    if (category) data.category = category;
    if (dueDate) data.dueDate = new Date(dueDate);
    
    const todo = await prisma.todo.create({ data });
    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, done, priority, category, dueDate } = req.body;
    
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (done !== undefined) data.done = done;
    if (priority !== undefined) data.priority = priority;
    if (category !== undefined) data.category = category;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    
    const todo = await prisma.todo.update({
      where: { id },
      data
    });
    
    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.todo.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

router.delete('/', async (req: Request, res: Response) => {
  try {
    await prisma.todo.deleteMany({ where: { done: true } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear completed todos' });
  }
});

export default router;
