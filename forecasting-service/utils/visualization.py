import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np

class Visualizer:
    def __init__(self):
        self.colors = {
            'primary': '#1f77b4',
            'secondary': '#ff7f0e', 
            'success': '#2ca02c',
            'danger': '#d62728',
            'warning': '#ff9800',
            'info': '#17a2b8'
        }
    
    def plot_forecast_comparison(self, processed_data, train_data, test_data, results, target_col, date_col):
        """Create comprehensive forecast comparison plot"""
        
        fig = make_subplots(
            rows=2, cols=1,
            subplot_titles=('Historical Data vs Forecasts', 'Future Forecasts'),
            vertical_spacing=0.1,
            row_heights=[0.6, 0.4]
        )
        
        # Plot 1: Historical data vs test predictions
        # Historical training data
        fig.add_trace(
            go.Scatter(
                x=train_data[date_col],
                y=train_data[target_col],
                mode='lines',
                name='Training Data',
                line=dict(color=self.colors['primary'], width=2),
                showlegend=True
            ),
            row=1, col=1
        )
        
        # Actual test data
        fig.add_trace(
            go.Scatter(
                x=test_data[date_col],
                y=test_data[target_col],
                mode='lines',
                name='Actual Test Data',
                line=dict(color=self.colors['success'], width=2),
                showlegend=True
            ),
            row=1, col=1
        )
        
        # Model predictions on test data
        colors_list = [self.colors['secondary'], self.colors['danger'], self.colors['warning'], self.colors['info']]
        for i, (model_name, result) in enumerate(results.items()):
            color = colors_list[i % len(colors_list)]
            fig.add_trace(
                go.Scatter(
                    x=test_data[date_col],
                    y=result['test_predictions'],
                    mode='lines',
                    name=f'{model_name} Predictions',
                    line=dict(color=color, width=2, dash='dash'),
                    showlegend=True
                ),
                row=1, col=1
            )
        
        # Plot 2: Future forecasts
        for i, (model_name, result) in enumerate(results.items()):
            color = colors_list[i % len(colors_list)]
            fig.add_trace(
                go.Scatter(
                    x=result['future_forecasts']['dates'],
                    y=result['future_forecasts']['values'],
                    mode='lines+markers',
                    name=f'{model_name} Forecast',
                    line=dict(color=color, width=2),
                    marker=dict(size=4),
                    showlegend=True
                ),
                row=2, col=1
            )
        
        # Update layout
        fig.update_layout(
            title='Time Series Forecasting Results',
            height=800,
            hovermode='x unified',
            legend=dict(
                orientation="h",
                yanchor="bottom",
                y=1.02,
                xanchor="right",
                x=1
            )
        )
        
        fig.update_xaxes(title_text="Date", row=2, col=1)
        fig.update_yaxes(title_text=target_col, row=1, col=1)
        fig.update_yaxes(title_text="Forecasted Values", row=2, col=1)
        
        return fig
    
    def plot_model_comparison(self, results, test_data, target_col):
        """Create model comparison visualization"""
        
        fig = make_subplots(
            rows=1, cols=2,
            subplot_titles=('Prediction Accuracy', 'Residual Analysis'),
            horizontal_spacing=0.1
        )
        
        colors_list = [self.colors['secondary'], self.colors['danger'], self.colors['warning'], self.colors['info']]
        
        # Plot 1: Actual vs Predicted scatter
        for i, (model_name, result) in enumerate(results.items()):
            color = colors_list[i % len(colors_list)]
            fig.add_trace(
                go.Scatter(
                    x=test_data[target_col],
                    y=result['test_predictions'],
                    mode='markers',
                    name=model_name,
                    marker=dict(color=color, size=8, opacity=0.7),
                    showlegend=True
                ),
                row=1, col=1
            )
        
        # Add perfect prediction line
        min_val = min(test_data[target_col].min(), min([result['test_predictions'].min() for result in results.values()]))
        max_val = max(test_data[target_col].max(), max([result['test_predictions'].max() for result in results.values()]))
        
        fig.add_trace(
            go.Scatter(
                x=[min_val, max_val],
                y=[min_val, max_val],
                mode='lines',
                name='Perfect Prediction',
                line=dict(color='black', dash='dash'),
                showlegend=False
            ),
            row=1, col=1
        )
        
        # Plot 2: Residuals
        for i, (model_name, result) in enumerate(results.items()):
            color = colors_list[i % len(colors_list)]
            residuals = test_data[target_col].values - result['test_predictions']
            fig.add_trace(
                go.Scatter(
                    x=result['test_predictions'],
                    y=residuals,
                    mode='markers',
                    name=f'{model_name} Residuals',
                    marker=dict(color=color, size=8, opacity=0.7),
                    showlegend=False
                ),
                row=1, col=2
            )
        
        # Add zero residual line
        fig.add_trace(
            go.Scatter(
                x=[min([result['test_predictions'].min() for result in results.values()]),
                   max([result['test_predictions'].max() for result in results.values()])],
                y=[0, 0],
                mode='lines',
                line=dict(color='black', dash='dash'),
                showlegend=False
            ),
            row=1, col=2
        )
        
        # Update layout
        fig.update_layout(
            title='Model Performance Comparison',
            height=500,
            showlegend=True
        )
        
        fig.update_xaxes(title_text="Actual Values", row=1, col=1)
        fig.update_yaxes(title_text="Predicted Values", row=1, col=1)
        fig.update_xaxes(title_text="Predicted Values", row=1, col=2)
        fig.update_yaxes(title_text="Residuals", row=1, col=2)
        
        return fig
    
    def plot_accuracy_metrics(self, results):
        """Create accuracy metrics visualization"""
        
        metrics = ['MAE', 'RMSE', 'MAPE']
        model_names = list(results.keys())
        
        fig = make_subplots(
            rows=1, cols=3,
            subplot_titles=metrics,
            horizontal_spacing=0.15
        )
        
        colors_list = [self.colors['secondary'], self.colors['danger'], self.colors['warning'], self.colors['info']]
        
        for j, metric in enumerate(['MAE', 'RMSE', 'MAPE']):
            values = [results[model]['accuracy_metrics'][metric] for model in model_names]
            
            fig.add_trace(
                go.Bar(
                    x=model_names,
                    y=values,
                    name=metrics[j],
                    marker_color=[colors_list[i % len(colors_list)] for i in range(len(model_names))],
                    showlegend=False,
                    text=[f'{v:.4f}' if metric != 'MAPE' else f'{v:.2f}%' for v in values],
                    textposition='auto'
                ),
                row=1, col=j+1
            )
        
        fig.update_layout(
            title='Model Accuracy Metrics Comparison',
            height=400,
            showlegend=False
        )
        
        # Update y-axis labels
        fig.update_yaxes(title_text="MAE", row=1, col=1)
        fig.update_yaxes(title_text="RMSE", row=1, col=2)
        fig.update_yaxes(title_text="MAPE (%)", row=1, col=3)
        
        return fig
    
    def plot_data_overview(self, data, target_col, date_col):
        """Create data overview plots"""
        
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=('Time Series Plot', 'Distribution', 'Seasonal Decomposition', 'Box Plot'),
            specs=[[{"colspan": 2}, None],
                   [{"type": "histogram"}, {"type": "box"}]],
            vertical_spacing=0.1
        )
        
        # Time series plot
        fig.add_trace(
            go.Scatter(
                x=data[date_col],
                y=data[target_col],
                mode='lines',
                name='Time Series',
                line=dict(color=self.colors['primary'], width=2)
            ),
            row=1, col=1
        )
        
        # Distribution histogram
        fig.add_trace(
            go.Histogram(
                x=data[target_col],
                name='Distribution',
                marker_color=self.colors['secondary'],
                opacity=0.7
            ),
            row=2, col=1
        )
        
        # Box plot
        fig.add_trace(
            go.Box(
                y=data[target_col],
                name='Box Plot',
                marker_color=self.colors['success']
            ),
            row=2, col=2
        )
        
        fig.update_layout(
            title='Data Overview',
            height=600,
            showlegend=False
        )
        
        return fig
    
    def plot_feature_importance(self, model, feature_names):
        """Plot feature importance for tree-based models"""
        
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            
            fig = go.Figure(data=go.Bar(
                x=feature_names,
                y=importances,
                marker_color=self.colors['primary']
            ))
            
            fig.update_layout(
                title='Feature Importance',
                xaxis_title='Features',
                yaxis_title='Importance',
                height=400
            )
            
            return fig
        
        return None
