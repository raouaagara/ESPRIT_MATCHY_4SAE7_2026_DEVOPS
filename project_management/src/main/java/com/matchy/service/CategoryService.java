package com.matchy.service;

import com.matchy.entity.Category;
import com.matchy.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public List<Category> getAll() {
        return categoryRepository.findAll();
    }

    public List<Category> getActive() {
        return categoryRepository.findByActiveTrue();
    }

    public Optional<Category> getById(Long id) {
        return categoryRepository.findById(id);
    }

    public Category create(Category category) {
        if (categoryRepository.existsByNameIgnoreCase(category.getName())) {
            throw new RuntimeException("Category with name '" + category.getName() + "' already exists");
        }
        return categoryRepository.save(category);
    }

    public Category update(Long id, Category updated) {
        Category existing = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        if (!existing.getName().equalsIgnoreCase(updated.getName())
                && categoryRepository.existsByNameIgnoreCase(updated.getName())) {
            throw new RuntimeException("Category with name '" + updated.getName() + "' already exists");
        }

        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setColor(updated.getColor());   // ← color
        existing.setIcon(updated.getIcon());
        if (updated.getActive() != null) existing.setActive(updated.getActive());

        return categoryRepository.save(existing);
    }

    public void delete(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new RuntimeException("Category not found with id: " + id);
        }
        categoryRepository.deleteById(id);
    }

    public Category toggleActive(Long id) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        category.setActive(!category.getActive());
        return categoryRepository.save(category);
    }

    public long countActive() {
        return categoryRepository.countByActiveTrue();
    }
}