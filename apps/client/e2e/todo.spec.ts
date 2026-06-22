import { test, expect } from '@playwright/test';

test.describe.serial('Todo App E2E', () => {
  test.beforeEach(async ({ page, request }) => {
    // Reset server DB via direct API call
    await request.post('http://127.0.0.1:3001/api/reset').catch(() => {});
    // Navigate to app
    await page.goto('/');
    await page.waitForSelector('h1');
  });

  test('should display the app title and structure', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('ToDo List');
    await expect(page.getByRole('application', { name: 'Todo app' })).toBeVisible();
    // List is present but may be empty
    await expect(page.locator('ul[aria-label="Todo list"]')).toBeAttached();
    await expect(page.getByRole('textbox', { name: 'New task' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add todo' })).toBeDisabled();
    await expect(page.getByRole('tablist', { name: 'Todo filters' })).toBeVisible();
  });

  test('should add a new todo', async ({ page }) => {
    const input = page.getByRole('textbox', { name: 'New task' });
    await input.fill('Buy groceries');
    await expect(page.getByRole('button', { name: 'Add todo' })).toBeEnabled();

    await page.getByRole('button', { name: 'Add todo' }).click();

    // Should appear in list
    await expect(page.getByText('Buy groceries')).toBeVisible();
    // Input should be cleared
    await expect(input).toHaveValue('');
    // Add button should be disabled again
    await expect(page.getByRole('button', { name: 'Add todo' })).toBeDisabled();
  });

  test('should not add empty todo', async ({ page }) => {
    const input = page.getByRole('textbox', { name: 'New task' });
    await input.fill('   ');
    await expect(page.getByRole('button', { name: 'Add todo' })).toBeDisabled();
  });

  test('should toggle todo complete/incomplete', async ({ page }) => {
    // Add a todo
    await page.getByRole('textbox', { name: 'New task' }).fill('Test toggle');
    await page.getByRole('button', { name: 'Add todo' }).click();

    // Find the specific todo item
    const todoItem = page.getByRole('listitem').filter({ hasText: 'Test toggle' });

    // Mark as done
    const markDoneBtn = todoItem.getByRole('button', { name: 'Mark as done' });
    await markDoneBtn.click();

    // Button should change to "Mark as not done"
    await expect(todoItem.getByRole('button', { name: 'Mark as not done' })).toBeVisible();
    // Check should show ✓
    await expect(todoItem.getByRole('button', { name: 'Mark as not done' })).toHaveText('✓');

    // Mark as not done again
    await todoItem.getByRole('button', { name: 'Mark as not done' }).click();
    await expect(todoItem.getByRole('button', { name: 'Mark as done' })).toBeVisible();
  });

  test('should edit a todo', async ({ page }) => {
    await page.getByRole('textbox', { name: 'New task' }).fill('Original text');
    await page.getByRole('button', { name: 'Add todo' }).click();

    const todoItem = page.getByRole('listitem').filter({ hasText: 'Original text' });

    // Click the edit pencil icon
    const editBtn = todoItem.getByRole('button', { name: 'Edit' }).last();
    await editBtn.click();

    // Should show edit input
    const editInput = page.getByRole('textbox', { name: 'Edit' });
    await expect(editInput).toBeVisible();
    await expect(editInput).toHaveValue('Original text');

    // Save and Cancel buttons should be visible
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();

    // Edit the text
    await editInput.fill('Updated text');
    await page.getByRole('button', { name: 'Save' }).click();

    // Should show updated text
    await expect(page.getByText('Updated text')).toBeVisible();
    await expect(page.getByText('Original text')).not.toBeVisible();
  });

  test('should cancel editing a todo', async ({ page }) => {
    await page.getByRole('textbox', { name: 'New task' }).fill('Keep this');
    await page.getByRole('button', { name: 'Add todo' }).click();

    const todoItem = page.getByRole('listitem').filter({ hasText: 'Keep this' });

    // Enter edit mode
    const editBtn = todoItem.getByRole('button', { name: 'Edit' }).last();
    await editBtn.click();

    const editInput = page.getByRole('textbox', { name: 'Edit' });
    await editInput.fill('Changed but cancelled');

    // Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Original text should remain
    await expect(page.getByText('Keep this')).toBeVisible();
  });

  test('should delete a todo', async ({ page }) => {
    await page.getByRole('textbox', { name: 'New task' }).fill('Delete me');
    await page.getByRole('button', { name: 'Add todo' }).click();

    const todoItem = page.getByRole('listitem').filter({ hasText: 'Delete me' });

    // Click remove button
    const removeBtn = todoItem.getByRole('button', { name: 'Remove' });
    await removeBtn.click();

    // Todo should be gone
    await expect(page.getByText('Delete me')).not.toBeVisible();
  });

  test('should filter todos', async ({ page }) => {
    // Add several todos
    await page.getByRole('textbox', { name: 'New task' }).fill('Active 1');
    await page.getByRole('button', { name: 'Add todo' }).click();
    await page.getByRole('textbox', { name: 'New task' }).fill('Active 2');
    await page.getByRole('button', { name: 'Add todo' }).click();
    await page.getByRole('textbox', { name: 'New task' }).fill('Completed 1');
    await page.getByRole('button', { name: 'Add todo' }).click();

    // Mark the specific item as completed
    const completedItem = page.getByRole('listitem').filter({ hasText: 'Completed 1' });
    await completedItem.getByRole('button', { name: 'Mark as done' }).click();

    // Filter: Active
    await page.getByRole('button', { name: 'Show active' }).click();

    await expect(page.getByText('Active 1')).toBeVisible();
    await expect(page.getByText('Active 2')).toBeVisible();
    await expect(page.getByText('Completed 1')).not.toBeVisible();

    // Filter: Completed
    await page.getByRole('button', { name: 'Show completed' }).click();

    await expect(page.getByText('Active 1')).not.toBeVisible();
    await expect(page.getByText('Completed 1')).toBeVisible();

    // Filter: All
    await page.getByRole('button', { name: 'Show all' }).click();
    await expect(page.getByText('Active 1')).toBeVisible();
    await expect(page.getByText('Completed 1')).toBeVisible();
  });

  test('should clear completed todos', async ({ page }) => {
    await page.getByRole('textbox', { name: 'New task' }).fill('Stay');
    await page.getByRole('button', { name: 'Add todo' }).click();
    await page.getByRole('textbox', { name: 'New task' }).fill('Completed one');
    await page.getByRole('button', { name: 'Add todo' }).click();

    // Mark the specific item as completed
    const completedItem = page.getByRole('listitem').filter({ hasText: 'Completed one' });
    await completedItem.getByRole('button', { name: 'Mark as done' }).click();

    // Clear completed
    await page.getByRole('button', { name: 'Clear completed' }).click();

    await expect(page.getByText('Stay')).toBeVisible();
    await expect(page.getByText('Completed one')).not.toBeVisible();
  });

  test('should persist todos across reload (local-first)', async ({ page }) => {
    await page.getByRole('textbox', { name: 'New task' }).fill('Persist me');
    await page.getByRole('button', { name: 'Add todo' }).click();

    // Wait for the todo to appear (ensure it's saved to IndexedDB)
    await expect(page.getByText('Persist me')).toBeVisible();

    // Reload the page
    await page.reload();
    await page.waitForSelector('h1');

    // Todo should still be there (from IndexedDB)
    await expect(page.getByText('Persist me')).toBeVisible();
  });

  test('should switch language to Russian', async ({ page }) => {
    await page.getByRole('button', { name: 'RU' }).click();

    // Check Russian labels
    await expect(page.getByRole('textbox', { name: 'Новая задача' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Добавить задачу' })).toBeVisible();
    await expect(page.getByRole('tablist', { name: 'Фильтры задач' })).toBeVisible();
    await expect(page.locator('ul[aria-label="Список задач"]')).toBeAttached();
    await expect(page.getByRole('button', { name: 'Показать все' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Очистить выполненные' })).toBeVisible();

    // Switch back to English
    await page.getByRole('button', { name: 'EN' }).click();
    await expect(page.getByRole('textbox', { name: 'New task' })).toBeVisible();
  });

  test('should disable toggle button while editing', async ({ page }) => {
    await page.getByRole('textbox', { name: 'New task' }).fill('Edit me');
    await page.getByRole('button', { name: 'Add todo' }).click();

    // Find the item by its text first
    await expect(page.getByText('Edit me')).toBeVisible();

    // Enter edit mode via the pencil - find the edit button in the same row
    const listItem = page.getByRole('listitem').filter({ hasText: 'Edit me' });
    await listItem.getByRole('button', { name: 'Edit' }).last().click();

    // Now in edit mode, find the disabled toggle button
    // The item now has a textbox with value 'Edit me'
    const editingItem = page.getByRole('listitem').filter({ has: page.getByRole('textbox', { name: 'Edit' }) });
    const markBtn = editingItem.getByRole('button', { name: 'Mark as done' });
    await expect(markBtn).toBeDisabled();
  });
});
