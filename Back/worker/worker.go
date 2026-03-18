package worker

import (
	"log"
	"sync"
)

type Task func()

var (
	taskQueue chan Task
	once      sync.Once
)

func Init(workerCount int, queueSize int) {
	once.Do(func() {
		taskQueue = make(chan Task, queueSize)
		for i := 0; i < workerCount; i++ {
			go worker(i)
		}
		log.Printf("Worker pool started with %d workers and queue size %d", workerCount, queueSize)
	})
}

func Shutdown() {
	if taskQueue != nil {
		close(taskQueue)
		log.Println("Worker pool shutting down...")
	}
}

func Submit(task Task) {
	if taskQueue == nil {
		log.Println("Worker pool not initialized, executing task synchronously")
		task()
		return
	}
	
	// Non-blocking submission to avoid hanging the caller if queue is full
	// (Alternatively, could use a select with timeout if blocking is desired)
	select {
	case taskQueue <- task:
	default:
		log.Println("Worker pool queue is full, executing task synchronously")
		task()
	}
}

func worker(id int) {
	for task := range taskQueue {
		executeTask(id, task)
	}
}

func executeTask(workerID int, task Task) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Worker %d: task panicked: %v", workerID, r)
		}
	}()
	task()
}
