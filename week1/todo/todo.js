// requires ../observable/observable.js
// requires ./fortuneService.js
// requires ../dataflow/dataflow.js

const TodoController = () => {

    const validateTodoText = (text) => {
        if (!text || text.trim().length === 0) {
            throw new Error("Task text cannot be empty");
        }
        if (text.length > 100) {
            throw new Error("Task text cannot be longer than 100 characters");
        }
        return true;
    };

    const transformTodoText = (text) => {
        return text.trim().toUpperCase();
    };

    const Todo = () => {
        const textAttr = Observable("text");
        const doneAttr = Observable(false);
        return {
            getDone:       doneAttr.getValue,
            setDone:       doneAttr.setValue,
            onDoneChanged: doneAttr.onChange,
            setText:       (text) => {
                validateTodoText(text);
                textAttr.setValue(transformTodoText(text));
            },
            getText:       textAttr.getValue,
            onTextChanged: textAttr.onChange,
        }
    };

    const todoModel = ObservableList([]);
    const scheduler = Scheduler();

    const addTodo = () => {
        const newTodo = Todo();
        todoModel.add(newTodo);
        return newTodo;
    };

    const addFortuneTodo = () => {
        const newTodo = Todo();
        todoModel.add(newTodo);
        newTodo.setText('...');

        scheduler.add( ok =>
           fortuneService( text => {
                   newTodo.setText(text);
                   ok();
               }
           )
        );
    };

    return {
        numberOfTodos:            todoModel.count,
        numberOfOpenTasks:        () => todoModel.countIf(todo => ! todo.getDone() ),
        addTodo:                  addTodo,
        addFortuneTodo:           addFortuneTodo,
        removeTodo:               todoModel.del,
        onTodoAdd:                todoModel.onAdd,
        onTodoRemove:             todoModel.onDel,
        removeTodoRemoveListener: todoModel.removeDeleteListener,
    }
};


// View-specific parts

const TodoItemsView = (todoController, rootElement) => {

    const render = todo => {

        function createElements() {
            const template = document.createElement('DIV');
            template.innerHTML = `
                <button class="delete">&times;</button>
                <input type="text" size="42">
                <input type="checkbox">
                <span class="error-message" style="color: red; display: none;"></span>
            `;
            return template.children;
        }
        const [deleteButton, inputElement, checkboxElement, errorMessage] = createElements();

        checkboxElement.onclick = _ => todo.setDone(checkboxElement.checked);
        deleteButton.onclick    = _ => todoController.removeTodo(todo);

        inputElement.onchange = _ => {
            try {
                todo.setText(inputElement.value);
                errorMessage.style.display = 'none';
            } catch (error) {
                errorMessage.textContent = error.message;
                errorMessage.style.display = 'inline';
            }
        };

        todoController.onTodoRemove( (removedTodo, removeMe) => {
            if (removedTodo !== todo) return;
            rootElement.removeChild(inputElement);
            rootElement.removeChild(deleteButton);
            rootElement.removeChild(checkboxElement);
            rootElement.removeChild(errorMessage);
            removeMe();
        } );

        todo.onTextChanged(() => inputElement.value = todo.getText());

        rootElement.appendChild(deleteButton);
        rootElement.appendChild(inputElement);
        rootElement.appendChild(checkboxElement);
        rootElement.appendChild(errorMessage);
    };

    todoController.onTodoAdd(render);
};

const TodoTotalView = (todoController, numberOfTasksElement) => {

    const render = () =>
        numberOfTasksElement.textContent = "" + todoController.numberOfTodos();

    // binding

    todoController.onTodoAdd(render);
    todoController.onTodoRemove(render);
};

const TodoOpenView = (todoController, numberOfOpenTasksElement) => {

    const render = () =>
        numberOfOpenTasksElement.textContent = "" + todoController.numberOfOpenTasks();

    // binding

    todoController.onTodoAdd(todo => {
        render();
        todo.onDoneChanged(render);
    });
    todoController.onTodoRemove(render);
};


